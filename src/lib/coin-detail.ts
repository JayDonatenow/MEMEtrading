import { getPairsForTokens } from "@/lib/dexscreener";
import { fullEvaluate, pairAgeMinutes } from "@/lib/evaluate-coin";
import { prisma } from "@/lib/db";

export interface CoinDetail {
  mintAddress: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  priceUsd: number | null;
  liquidityUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  ageMinutes: number | null;
  priceChange24h: number | null;
  txns24h: { buys: number; sells: number } | null;
  dexUrl: string;
  safetyScore: number;
  scoreLabel: string;
  reasons: string[];
  topHolderPct: number | null;
  clusteredPct: number | null;
  mintAuthorityRevoked: boolean | null;
  freezeAuthorityRevoked: boolean | null;
  lpBurnedOrLocked: boolean | null;
}

// Fetches live market + on-chain data for a coin, upserts it into the DB, and (when something
// meaningful changed since the last reading) records a new safety-score snapshot. Shared by the
// coin detail page (server-rendered) and the /api/coins/[address] route (client refetch/polling).
export async function getCoinDetail(mintAddress: string): Promise<CoinDetail | null> {
  const pairs = await getPairsForTokens([mintAddress]);
  const pair = pairs.find((p) => p.baseToken.address === mintAddress) ?? pairs[0];
  if (!pair) return null;

  const evaluation = await fullEvaluate(pair);

  const coin = await prisma.coin.upsert({
    where: { mintAddress },
    create: {
      mintAddress,
      pairAddress: pair.pairAddress,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      imageUrl: pair.info?.imageUrl,
      pairCreatedAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt) : null,
      priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
      liquidityUsd: pair.liquidity?.usd ?? null,
      marketCapUsd: pair.marketCap ?? null,
      volume24hUsd: pair.volume?.h24 ?? null,
      safetyScore: evaluation.score.score,
      scoreLabel: evaluation.score.label,
    },
    update: {
      priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
      liquidityUsd: pair.liquidity?.usd ?? null,
      marketCapUsd: pair.marketCap ?? null,
      volume24hUsd: pair.volume?.h24 ?? null,
      safetyScore: evaluation.score.score,
      scoreLabel: evaluation.score.label,
    },
  });

  const lastSnapshot = await prisma.safetyScoreSnapshot.findFirst({
    where: { coinId: coin.id },
    orderBy: { createdAt: "desc" },
  });

  const events: string[] = [];
  if (lastSnapshot && lastSnapshot.score !== evaluation.score.score) {
    const delta = evaluation.score.score - lastSnapshot.score;
    events.push(`Safety score ${delta > 0 ? "rose" : "dropped"} from ${lastSnapshot.score}% to ${evaluation.score.score}%`);
  }
  if (lastSnapshot?.mintRevoked === false && evaluation.mintAuthorityRevoked === true) {
    events.push("Mint authority was renounced");
  }
  if (lastSnapshot?.freezeRevoked === false && evaluation.freezeAuthorityRevoked === true) {
    events.push("Freeze authority was renounced");
  }
  if (lastSnapshot?.lpBurnedOrLocked === false && evaluation.lpBurnedOrLocked === true) {
    events.push("Liquidity was locked or burned");
  }

  const isStale = !lastSnapshot || Date.now() - lastSnapshot.createdAt.getTime() > 15 * 60_000;
  if (isStale || events.length > 0) {
    await prisma.safetyScoreSnapshot.create({
      data: {
        coinId: coin.id,
        score: evaluation.score.score,
        liquidityUsd: pair.liquidity?.usd ?? null,
        topHolderPct: evaluation.topHolderPct,
        clusteredPct: evaluation.clusteredPct,
        mintRevoked: evaluation.mintAuthorityRevoked,
        freezeRevoked: evaluation.freezeAuthorityRevoked,
        lpBurnedOrLocked: evaluation.lpBurnedOrLocked,
        events: events.length > 0 ? JSON.stringify(events) : null,
      },
    });
  }

  return {
    mintAddress,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    imageUrl: pair.info?.imageUrl ?? null,
    priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
    liquidityUsd: pair.liquidity?.usd ?? null,
    marketCapUsd: pair.marketCap ?? null,
    volume24hUsd: pair.volume?.h24 ?? null,
    ageMinutes: pairAgeMinutes(pair),
    priceChange24h: pair.priceChange?.h24 ?? null,
    txns24h: pair.txns?.h24 ?? null,
    dexUrl: `https://dexscreener.com/solana/${pair.pairAddress}`,
    safetyScore: evaluation.score.score,
    scoreLabel: evaluation.score.label,
    reasons: evaluation.score.reasons,
    topHolderPct: evaluation.topHolderPct,
    clusteredPct: evaluation.clusteredPct,
    mintAuthorityRevoked: evaluation.mintAuthorityRevoked,
    freezeAuthorityRevoked: evaluation.freezeAuthorityRevoked,
    lpBurnedOrLocked: evaluation.lpBurnedOrLocked,
  };
}
