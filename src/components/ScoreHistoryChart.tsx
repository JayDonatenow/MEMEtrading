"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ScoreHistoryPoint } from "@/lib/types";

export function ScoreHistoryChart({ mintAddress }: { mintAddress: string }) {
  const [history, setHistory] = useState<ScoreHistoryPoint[] | null>(null);

  useEffect(() => {
    fetch(`/api/coins/${mintAddress}/history`)
      .then((res) => res.json())
      .then((data) => setHistory(data.history))
      .catch(() => setHistory([]));
  }, [mintAddress]);

  if (!history) {
    return <p className="text-sm text-zinc-500">Loading history…</p>;
  }

  if (history.length < 2) {
    return (
      <p className="text-sm text-zinc-500">
        Not enough history yet — check back after this coin has been scanned a few times.
      </p>
    );
  }

  const data = history.map((h) => ({
    time: new Date(h.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    score: h.score,
  }));

  const events = history.filter((h) => h.events.length > 0);

  return (
    <div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#71717a" fontSize={12} tickLine={false} width={32} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
              labelStyle={{ color: "#e4e4e7" }}
            />
            <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {events.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-zinc-500">
          {events.slice(-5).map((e, i) => (
            <li key={i}>
              <span className="text-zinc-600">{new Date(e.createdAt).toLocaleString()}:</span>{" "}
              {e.events.join(", ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
