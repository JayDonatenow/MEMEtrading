import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-100">
          MEME<span className="text-emerald-400">trading</span>
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-zinc-400">
          <Link href="/" className="hover:text-zinc-100">
            Discover
          </Link>
          <Link href="/watchlist" className="hover:text-zinc-100">
            Watchlist
          </Link>
        </nav>
      </div>
    </header>
  );
}
