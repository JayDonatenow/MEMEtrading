import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-zinc-100">Coin not found</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        We couldn&apos;t find a page here — if you searched for a coin, double-check the mint
        address (it should be a Solana contract address, not a pair or wallet address).
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10"
      >
        Back to Discover
      </Link>
    </main>
  );
}
