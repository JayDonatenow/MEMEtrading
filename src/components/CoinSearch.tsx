"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Solana addresses are base58: digits/letters minus 0, O, I, l, typically 32-44 chars.
const MINT_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function CoinSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const address = value.trim();
    if (!MINT_ADDRESS_RE.test(address)) {
      setError("That doesn't look like a Solana mint address (contract address)");
      return;
    }
    setError(null);
    router.push(`/coin/${address}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a coin's mint address…"
          spellCheck={false}
          className="w-56 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-400/50 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-white/10"
        >
          Check
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
