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

const TOKENS_PER_REQUEST = 30; // DexScreener silently truncates batches larger than this

export async function getPairsForTokens(mintAddresses: string[]): Promise<DexScreenerPair[]> {
  if (mintAddresses.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < mintAddresses.length; i += TOKENS_PER_REQUEST) {
    batches.push(mintAddresses.slice(i, i + TOKENS_PER_REQUEST));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const data = await dexFetch<DexScreenerPair[] | { pairs: DexScreenerPair[] }>(
        `/tokens/v1/solana/${batch.join(",")}`,
      );
      return Array.isArray(data) ? data : data.pairs ?? [];
    }),
  );

  return results.flat();
}

interface DexScreenerTokenRef {
  chainId: string;
  tokenAddress: string;
}

async function fetchSolanaTokenAddresses(path: string): Promise<string[]> {
  const refs = await dexFetch<DexScreenerTokenRef[]>(path);
  return refs.filter((r) => r.chainId === "solana").map((r) => r.tokenAddress);
}

// Well-known/established tokens that keep showing up as "base token" on generic listings —
// not what anyone means by a fresh meme coin, so they're excluded outright.
const EXCLUDED_SYMBOLS = new Set(["SOL", "WSOL", "USDC", "USDT", "USDE", "ETH", "WETH", "BTC", "WBTC"]);

// Discovers fresh Solana meme coins from DexScreener's curated "new token" signals (recently
// profiled tokens and recently boosted/promoted tokens) rather than free-text search, which
// mostly just matched wrapped SOL and other unrelated pairs containing "solana"/"pump" in their
// name. These endpoints return bare token addresses; we then fetch real market data for them.
export async function discoverFreshSolanaPairs(): Promise<DexScreenerPair[]> {
  const sources = await Promise.allSettled([
    fetchSolanaTokenAddresses("/token-profiles/latest/v1"),
    fetchSolanaTokenAddresses("/token-boosts/latest/v1"),
  ]);

  const addresses = new Set<string>();
  for (const s of sources) {
    if (s.status !== "fulfilled") continue;
    for (const addr of s.value) addresses.add(addr);
  }
  if (addresses.size === 0) return [];

  const pairs = await getPairsForTokens([...addresses]);

  const byBaseToken = new Map<string, DexScreenerPair>();
  for (const pair of pairs) {
    if (pair.chainId !== "solana") continue;
    if (EXCLUDED_SYMBOLS.has(pair.baseToken.symbol.toUpperCase())) continue;
    if ((pair.liquidity?.usd ?? 0) < 1000) continue;

    const existing = byBaseToken.get(pair.baseToken.address);
    if (!existing || (pair.liquidity?.usd ?? 0) > (existing.liquidity?.usd ?? 0)) {
      byBaseToken.set(pair.baseToken.address, pair);
    }
  }

  return [...byBaseToken.values()].sort(
    (a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0),
  );
}
