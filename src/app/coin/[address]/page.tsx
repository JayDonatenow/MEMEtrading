import { notFound } from "next/navigation";
import { SafetyBadge } from "@/components/SafetyBadge";
import { CoinIcon } from "@/components/CoinIcon";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { TweetList } from "@/components/TweetList";
import { WatchlistButton } from "@/components/WatchlistButton";
import { formatAge, formatPct, formatUsd } from "@/lib/format";
import { getCoinDetail } from "@/lib/coin-detail";

export default async function CoinPage({ params }: PageProps<"/coin/[address]">) {
  const { address } = await params;

  let coin;
  try {
    coin = await getCoinDetail(address);
  } catch {
    coin = null;
  }
  if (!coin) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CoinIcon imageUrl={coin.imageUrl} symbol={coin.symbol} size={48} />
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              ${coin.symbol} <span className="font-normal text-zinc-500">{coin.name}</span>
            </h1>
            <a
              href={coin.dexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-zinc-500 hover:text-zinc-300"
            >
              {coin.mintAddress}
            </a>
          </div>
        </div>
        <SafetyBadge score={coin.safetyScore} label={coin.scoreLabel} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Price" value={formatUsd(coin.priceUsd)} />
        <Stat label="Liquidity" value={formatUsd(coin.liquidityUsd)} />
        <Stat label="Market Cap" value={formatUsd(coin.marketCapUsd)} />
        <Stat label="24h Volume" value={formatUsd(coin.volume24hUsd)} />
        <Stat label="Age" value={formatAge(coin.ageMinutes)} />
        <Stat label="Top holder" value={formatPct(coin.topHolderPct)} />
        <Stat label="Linked wallets" value={formatPct(coin.clusteredPct)} />
        <Stat
          label="24h txns"
          value={coin.txns24h ? `${coin.txns24h.buys}B / ${coin.txns24h.sells}S` : "—"}
        />
      </div>

      <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Safety checks</h2>
        <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <CheckRow label="Mint authority renounced" value={coin.mintAuthorityRevoked} />
          <CheckRow label="Freeze authority renounced" value={coin.freezeAuthorityRevoked} />
          <CheckRow label="Liquidity locked or burned" value={coin.lpBurnedOrLocked} />
        </ul>
        {coin.reasons.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm text-zinc-400">
            {coin.reasons.map((r, i) => (
              <li key={i}>⚠️ {r}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Safety score history</h2>
        <ScoreHistoryChart mintAddress={coin.mintAddress} />
      </section>

      <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Watch this coin</h2>
        <WatchlistButton mintAddress={coin.mintAddress} />
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Relevant tweets</h2>
        <TweetList mintAddress={coin.mintAddress} />
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 font-medium text-zinc-200">{value}</p>
    </div>
  );
}

function CheckRow({ label, value }: { label: string; value: boolean | null }) {
  const icon = value === null ? "❔" : value ? "✅" : "❌";
  return (
    <li className="flex items-center gap-2">
      <span>{icon}</span>
      <span className="text-zinc-300">{label}</span>
    </li>
  );
}
