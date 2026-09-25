// Thin client for DexScreener's public API (no key required).
// Docs: https://docs.dexscreener.com/api/reference

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  volume?: { h24?: number; h6?: number; h1?: number };
  txns?: {
    h24?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
  };
  priceChange?: { h24?: number; h1?: number };
  info?: { imageUrl?: string };
}

const BASE_URL = "https://api.dexscreener.com";

async function dexFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`DexScreener request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// DexScreener's "token boosts" / "token profiles" endpoints surface freshly promoted tokens;
// combined with search, this gives us a reasonable feed of new Solana meme coins.
export async function searchSolanaPairs(query: string): Promise<DexScreenerPair[]> {
  const data = await dexFetch<{ pairs: DexScreenerPair[] | null }>(
    `/latest/dex/search?q=${encodeURIComponent(query)}`,
  );
  return (data.pairs ?? []).filter((p) => p.chainId === "solana");
}

export async function getPairsForTokens(mintAddresses: string[]): Promise<DexScreenerPair[]> {
  if (mintAddresses.length === 0) return [];
  const data = await dexFetch<DexScreenerPair[] | { pairs: DexScreenerPair[] }>(
    `/tokens/v1/solana/${mintAddresses.join(",")}`,
  );
  return Array.isArray(data) ? data : data.pairs ?? [];
}

// Fetches a broad set of fresh Solana pairs by searching common quote symbols people pair
// meme coins against, then de-duping by base token. DexScreener has no "list all new pairs"
// endpoint on the free tier, so this search-based approach is the practical way to discover them.
export async function discoverFreshSolanaPairs(): Promise<DexScreenerPair[]> {
  const queries = ["solana", "pump"];
  const results = await Promise.allSettled(queries.map((q) => searchSolanaPairs(q)));

  const byBaseToken = new Map<string, DexScreenerPair>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const pair of r.value) {
      const existing = byBaseToken.get(pair.baseToken.address);
      if (!existing || (pair.pairCreatedAt ?? 0) > (existing.pairCreatedAt ?? 0)) {
        byBaseToken.set(pair.baseToken.address, pair);
      }
    }
  }

  return [...byBaseToken.values()].sort(
    (a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0),
  );
}
