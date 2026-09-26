import Link from "next/link";
import { SafetyBadge } from "@/components/SafetyBadge";
import { CoinIcon } from "@/components/CoinIcon";
import { formatAge, formatPctChange, formatUsd } from "@/lib/format";
import type { CoinListItem } from "@/lib/types";

export function CoinCard({ coin }: { coin: CoinListItem }) {
  return (
    <Link
      href={`/coin/${coin.mintAddress}`}
      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <CoinIcon imageUrl={coin.imageUrl} symbol={coin.symbol} size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-100">${coin.symbol}</p>
            <p className="truncate text-sm text-zinc-500">{coin.name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <SafetyBadge score={coin.safetyScore} label={coin.scoreLabel} />
          {coin.priceChange24h !== null && (
            <span
              className={`text-xs font-medium ${
                coin.priceChange24h > 0
                  ? "text-emerald-400"
                  : coin.priceChange24h < 0
                    ? "text-red-400"
                    : "text-zinc-500"
              }`}
            >
              {formatPctChange(coin.priceChange24h)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-zinc-500">Liquidity</p>
          <p className="font-medium text-zinc-200">{formatUsd(coin.liquidityUsd)}</p>
        </div>
        <div>
          <p className="text-zinc-500">Mkt Cap</p>
          <p className="font-medium text-zinc-200">{formatUsd(coin.marketCapUsd)}</p>
        </div>
        <div>
          <p className="text-zinc-500">Age</p>
          <p className="font-medium text-zinc-200">{formatAge(coin.ageMinutes)}</p>
        </div>
      </div>

      {coin.reasons.length > 0 && (
        <p className="truncate text-xs text-zinc-500">{coin.reasons[0]}</p>
      )}
    </Link>
  );
}
