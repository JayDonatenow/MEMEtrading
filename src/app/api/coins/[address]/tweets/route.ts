import { NextResponse } from "next/server";
import { isXApiConfigured, searchCoinTweets } from "@/lib/x-api";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, ctx: RouteContext<"/api/coins/[address]/tweets">) {
  const { address } = await ctx.params;

  if (!isXApiConfigured()) {
    return NextResponse.json({ tweets: [], configured: false });
  }

  const coin = await prisma.coin.findUnique({ where: { mintAddress: address } });
  if (!coin) {
    return NextResponse.json({ error: "Coin not found" }, { status: 404 });
  }

  try {
    const tweets = await searchCoinTweets({
      symbol: coin.symbol,
      name: coin.name,
      mintAddress: coin.mintAddress,
    });
    return NextResponse.json({ tweets, configured: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch tweets", configured: true },
      { status: 502 },
    );
  }
}
