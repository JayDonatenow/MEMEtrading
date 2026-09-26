export interface CoinListItem {
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
  safetyScore: number;
  scoreLabel: string;
  reasons: string[];
}

export interface WatchlistEntry {
  id: string;
  alertBelowScore: number | null;
  notifyEmail: string | null;
  coin: {
    mintAddress: string;
    symbol: string;
    name: string;
    imageUrl: string | null;
    safetyScore: number | null;
    scoreLabel: string | null;
  };
}

export interface ScoreHistoryPoint {
  createdAt: string;
  score: number;
  liquidityUsd: number | null;
  topHolderPct: number | null;
  clusteredPct: number | null;
  events: string[];
}
