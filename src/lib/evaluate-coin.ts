import type { DexScreenerPair } from "@/lib/dexscreener";
import { computeSafetyScore, type SafetyScoreInput } from "@/lib/safety-score";
import { findLinkedWallets, getMintAuthorityInfo, getTopHolders, summarizeClustering } from "@/lib/solana";

export function pairAgeMinutes(pair: DexScreenerPair): number | null {
  if (!pair.pairCreatedAt) return null;
  return (Date.now() - pair.pairCreatedAt) / 60_000;
}

function buySellRatio(pair: DexScreenerPair): number | null {
  const t = pair.txns?.h24;
  if (!t) return null;
  const total = t.buys + t.sells;
  if (total === 0) return null;
  return t.buys / total;
}

// Venues where liquidity is protocol-controlled by design, not withdrawable by the token
// creator: pump.fun's bonding curve, and PumpSwap (their in-house AMM for graduated tokens).
// Any other venue (Raydium, Orca, etc.) might still have burned/locked LP, but verifying that
// generically requires per-DEX pool parsing we don't do, so it's left as unknown (null) rather
// than guessed — missing data never helps the score, per the scorer's own convention.
const PROTOCOL_LOCKED_DEX_IDS = new Set(["pumpfun", "pumpswap"]);

function inferLpLockStatus(pair: DexScreenerPair): boolean | null {
  return PROTOCOL_LOCKED_DEX_IDS.has(pair.dexId) ? true : null;
}

// Fast score using only DexScreener market data — no RPC calls — for rendering the list view.
export function quickEvaluate(pair: DexScreenerPair) {
  const input: SafetyScoreInput = {
    liquidityUsd: pair.liquidity?.usd ?? null,
    ageMinutes: pairAgeMinutes(pair),
    mintAuthorityRevoked: null,
    freezeAuthorityRevoked: null,
    topHolderPct: null,
    clusteredPct: null,
    buySellRatio24h: buySellRatio(pair),
    lpBurnedOrLocked: inferLpLockStatus(pair),
  };
  return computeSafetyScore(input);
}

export interface FullEvaluation {
  score: ReturnType<typeof computeSafetyScore>;
  topHolderPct: number | null;
  clusteredPct: number | null;
  mintAuthorityRevoked: boolean | null;
  freezeAuthorityRevoked: boolean | null;
  lpBurnedOrLocked: boolean | null;
}

// Full score including on-chain checks — used for the coin detail page, where the extra
// RPC round-trips (mint authority + top holders + best-effort wallet clustering) are worth it.
export async function fullEvaluate(pair: DexScreenerPair): Promise<FullEvaluation> {
  const mintAddress = pair.baseToken.address;

  const [authorityInfo, holders] = await Promise.all([
    getMintAuthorityInfo(mintAddress),
    getTopHolders(mintAddress, 10).catch(() => []),
  ]);

  // Exclude the largest holder if it's overwhelmingly likely the LP/pool itself (no reliable
  // on-chain tag for this without a DEX-specific lookup, so we use a simple size heuristic:
  // treat the single largest holder as "pool" only when it dwarfs the rest of the top 10).
  const nonPoolHolders =
    holders.length > 1 && holders[0].pct > holders[1].pct * 3 ? holders.slice(1) : holders;

  const topHolderPct = nonPoolHolders[0]?.pct ?? null;

  let clusteredPct: number | null = null;
  if (nonPoolHolders.length > 1) {
    const funders = await findLinkedWallets(nonPoolHolders.map((h) => h.ownerAddress));
    clusteredPct = summarizeClustering(nonPoolHolders, funders).clusteredPct;
  }

  const lpBurnedOrLocked = inferLpLockStatus(pair);

  const input: SafetyScoreInput = {
    liquidityUsd: pair.liquidity?.usd ?? null,
    ageMinutes: pairAgeMinutes(pair),
    mintAuthorityRevoked: authorityInfo?.mintAuthorityRevoked ?? null,
    freezeAuthorityRevoked: authorityInfo?.freezeAuthorityRevoked ?? null,
    topHolderPct,
    clusteredPct,
    buySellRatio24h: buySellRatio(pair),
    lpBurnedOrLocked,
  };

  return {
    score: computeSafetyScore(input),
    topHolderPct,
    clusteredPct,
    mintAuthorityRevoked: authorityInfo?.mintAuthorityRevoked ?? null,
    freezeAuthorityRevoked: authorityInfo?.freezeAuthorityRevoked ?? null,
    lpBurnedOrLocked,
  };
}
