"use client";

import { useState } from "react";

// Token icons come from DexScreener's CDN (arbitrary hostnames), so this uses a plain <img>
// rather than next/image (which would require whitelisting every possible image host).
export function CoinIcon({
  imageUrl,
  symbol,
  size = 36,
}: {
  imageUrl: string | null;
  symbol: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300"
      >
        {symbol.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable CDN hosts
    <img
      src={imageUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
