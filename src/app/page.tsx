"use client";

import { useEffect, useState } from "react";
import { CoinCard } from "@/components/CoinCard";
import type { CoinListItem } from "@/lib/types";

export default function Home() {
  const [coins, setCoins] = useState<CoinListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/coins");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load coins");
      setCoins(data.coins);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Standard fetch-on-mount + polling; the async load() itself owns the setState calls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const visible = coins.filter((c) => c.safetyScore >= minScore);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Fresh Solana meme coins</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Newly launched coins, ranked by our rug-pull Safety % score.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-400">
            Min safety
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="ml-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-zinc-200"
            >
              <option value={0}>Any</option>
              <option value={25}>25%+</option>
              <option value={50}>50%+</option>
              <option value={75}>75%+</option>
            </select>
          </label>
          <button
            onClick={load}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-zinc-500">Scanning for fresh coins…</p>
      ) : visible.length === 0 ? (
        <p className="text-zinc-500">No coins match right now — try lowering the minimum safety filter.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((coin) => (
            <CoinCard key={coin.mintAddress} coin={coin} />
          ))}
        </div>
      )}
    </main>
  );
}
