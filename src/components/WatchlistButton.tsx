"use client";

import { useState } from "react";

export function WatchlistButton({ mintAddress }: { mintAddress: string }) {
  const [saving, setSaving] = useState(false);
  const [watching, setWatching] = useState(false);
  const [alertBelowScore, setAlertBelowScore] = useState<number | "">("");

  async function toggle() {
    setSaving(true);
    try {
      if (watching) {
        await fetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mintAddress }),
        });
        setWatching(false);
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mintAddress,
            alertBelowScore: alertBelowScore === "" ? null : alertBelowScore,
          }),
        });
        setWatching(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={toggle}
        disabled={saving}
        className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          watching
            ? "bg-white/10 text-zinc-200 hover:bg-white/15"
            : "bg-violet-500 text-violet-50 hover:bg-violet-400"
        }`}
      >
        {watching ? "Watching ✓" : "Add to watchlist"}
      </button>
      {!watching && (
        <label className="text-sm text-zinc-400">
          Alert if score drops below
          <input
            type="number"
            min={0}
            max={100}
            value={alertBelowScore}
            onChange={(e) => setAlertBelowScore(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 50"
            className="ml-2 w-20 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-zinc-200"
          />
        </label>
      )}
    </div>
  );
}
