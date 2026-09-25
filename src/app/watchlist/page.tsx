"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SafetyBadge } from "@/components/SafetyBadge";
import type { WatchlistEntry } from "@/lib/types";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistEntry[] | null>(null);

  async function load() {
    const res = await fetch("/api/watchlist");
    const data = await res.json();
    setItems(data.items);
  }

  useEffect(() => {
    // Standard fetch-on-mount; the async load() itself owns the setState call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function remove(mintAddress: string) {
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mintAddress }),
    });
    load();
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-100">Your watchlist</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Coins you&apos;re tracking. Run the scan job periodically to keep scores and alerts up to date.
      </p>

      {!items ? (
        <p className="text-zinc-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-zinc-500">
          Nothing here yet.{" "}
          <Link href="/" className="text-violet-400 hover:underline">
            Browse coins
          </Link>{" "}
          and add some to your watchlist.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <Link href={`/coin/${item.coin.mintAddress}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-100">${item.coin.symbol}</p>
                <p className="truncate text-sm text-zinc-500">{item.coin.name}</p>
                {item.alertBelowScore !== null && (
                  <p className="mt-1 text-xs text-zinc-500">Alert below {item.alertBelowScore}%</p>
                )}
              </Link>
              <div className="flex items-center gap-3">
                {item.coin.safetyScore !== null && item.coin.scoreLabel && (
                  <SafetyBadge score={item.coin.safetyScore} label={item.coin.scoreLabel} />
                )}
                <button
                  onClick={() => remove(item.coin.mintAddress)}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/10"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
