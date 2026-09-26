import Link from "next/link";
import { CoinSearch } from "@/components/CoinSearch";

export function Nav() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-100">
          MEME<span className="text-violet-400">trading</span>
        </Link>
        <CoinSearch />
        <nav className="flex gap-6 text-sm font-medium text-zinc-400">
          <Link href="/" className="transition-colors hover:text-violet-300">
            Discover
          </Link>
          <Link href="/watchlist" className="transition-colors hover:text-violet-300">
            Watchlist
          </Link>
        </nav>
      </div>
    </header>
  );
}
