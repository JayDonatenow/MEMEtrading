import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

let connection: Connection | null = null;
function getConnection(): Connection {
  if (!connection) connection = new Connection(RPC_URL, "confirmed");
  return connection;
}

export interface MintAuthorityInfo {
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
}

// Whether the token's mint/freeze authorities have been renounced. A live mint authority
// means the dev can print unlimited new supply; a live freeze authority means they can
// freeze holders' wallets. Both renounced is a strong safety signal.
export async function getMintAuthorityInfo(mintAddress: string): Promise<MintAuthorityInfo | null> {
  try {
    const info = await getConnection().getParsedAccountInfo(new PublicKey(mintAddress));
    const parsed = info.value?.data;
    if (!parsed || typeof parsed !== "object" || !("parsed" in parsed)) return null;
    const mintInfo = (parsed as { parsed: { info: { mintAuthority: string | null; freezeAuthority: string | null } } })
      .parsed.info;
    return {
      mintAuthorityRevoked: mintInfo.mintAuthority === null,
      freezeAuthorityRevoked: mintInfo.freezeAuthority === null,
    };
  } catch {
    return null;
  }
}

export interface HolderInfo {
  ownerAddress: string;
  tokenAccountAddress: string;
  uiAmount: number;
  pct: number;
}

// Top token holders by balance (excludes nothing — callers should filter out the LP/pool
// address themselves, since that's expected to hold a large share and isn't a "holder").
export async function getTopHolders(mintAddress: string, limit = 10): Promise<HolderInfo[]> {
  const conn = getConnection();
  const mint = new PublicKey(mintAddress);

  const largest = await conn.getTokenLargestAccounts(mint);
  const accounts = largest.value.slice(0, limit);
  const total = accounts.reduce((sum, a) => sum + (a.uiAmount ?? 0), 0);
  if (total === 0) return [];

  const parsedAccounts = await conn.getMultipleParsedAccounts(accounts.map((a) => a.address));

  return accounts.map((a, i) => {
    const data = parsedAccounts.value[i]?.data;
    const owner =
      data && typeof data === "object" && "parsed" in data
        ? (data as { parsed: { info: { owner: string } } }).parsed.info.owner
        : a.address.toBase58();
    return {
      ownerAddress: owner,
      tokenAccountAddress: a.address.toBase58(),
      uiAmount: a.uiAmount ?? 0,
      pct: total > 0 ? ((a.uiAmount ?? 0) / total) * 100 : 0,
    };
  });
}

// Best-effort clustering: for each holder wallet, find the address that funded its very
// first transaction. Wallets funded by the same source (often the deployer, moving funds
// through a batch of "independent" wallets to hide concentration) are flagged as linked.
// This is inherently rate-limit-sensitive against public RPCs, so failures degrade to "unknown"
// rather than throwing, and callers should treat a null result as "couldn't determine."
export async function findLinkedWallets(
  ownerAddresses: string[],
  maxWalletsToCheck = 5,
): Promise<Map<string, string | null>> {
  const conn = getConnection();
  const result = new Map<string, string | null>();

  for (const owner of ownerAddresses.slice(0, maxWalletsToCheck)) {
    try {
      const pubkey = new PublicKey(owner);
      const sigs = await conn.getSignaturesForAddress(pubkey, { limit: 1000 });
      if (sigs.length === 0) {
        result.set(owner, null);
        continue;
      }
      const earliest = sigs[sigs.length - 1];
      const tx = await conn.getParsedTransaction(earliest.signature, {
        maxSupportedTransactionVersion: 0,
      });
      const accountKeys = tx?.transaction.message.accountKeys;
      const funder = accountKeys?.find((k) => k.pubkey.toBase58() !== owner && k.signer)?.pubkey.toBase58();
      result.set(owner, funder ?? null);
    } catch {
      result.set(owner, null);
    }
  }

  return result;
}

export interface ClusteringResult {
  clusteredPct: number;
  clusters: { fundedBy: string; wallets: string[] }[];
}

// Combines top-holder balances with the shared-funder heuristic into a single "% of top
// holder supply that appears linked to a single source" figure, for the safety score.
export function summarizeClustering(
  holders: HolderInfo[],
  funders: Map<string, string | null>,
): ClusteringResult {
  const byFunder = new Map<string, { pct: number; wallets: string[] }>();

  for (const holder of holders) {
    const funder = funders.get(holder.ownerAddress);
    if (!funder) continue;
    const existing = byFunder.get(funder) ?? { pct: 0, wallets: [] };
    existing.pct += holder.pct;
    existing.wallets.push(holder.ownerAddress);
    byFunder.set(funder, existing);
  }

  const clusters = [...byFunder.entries()]
    .filter(([, v]) => v.wallets.length > 1)
    .map(([fundedBy, v]) => ({ fundedBy, wallets: v.wallets, pct: v.pct }));

  const clusteredPct = clusters.reduce((sum, c) => sum + c.pct, 0);

  return { clusteredPct, clusters: clusters.map(({ fundedBy, wallets }) => ({ fundedBy, wallets })) };
}
