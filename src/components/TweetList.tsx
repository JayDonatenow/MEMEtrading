"use client";

import { useEffect, useState } from "react";

interface Tweet {
  id: string;
  text: string;
  authorUsername: string;
  authorName: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  url: string;
}

export function TweetList({ mintAddress }: { mintAddress: string }) {
  const [tweets, setTweets] = useState<Tweet[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/coins/${mintAddress}/tweets`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        setConfigured(data.configured ?? true);
        setTweets(data.tweets ?? []);
      })
      .catch(() => setError("Failed to load tweets"));
  }, [mintAddress]);

  if (!configured) {
    return (
      <p className="text-sm text-zinc-500">
        X integration isn&apos;t configured yet — set <code className="text-zinc-400">X_BEARER_TOKEN</code> in
        your environment to see relevant tweets here.
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!tweets) {
    return <p className="text-sm text-zinc-500">Loading tweets…</p>;
  }

  if (tweets.length === 0) {
    return <p className="text-sm text-zinc-500">No recent tweets found for this coin.</p>;
  }

  return (
    <ul className="space-y-3">
      {tweets.map((t) => (
        <li key={t.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <a href={t.url} target="_blank" rel="noopener noreferrer" className="block">
            <p className="text-sm font-medium text-zinc-200">
              {t.authorName} <span className="text-zinc-500">@{t.authorUsername}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-300">{t.text}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {t.likeCount} likes · {t.retweetCount} retweets ·{" "}
              {new Date(t.createdAt).toLocaleString()}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
