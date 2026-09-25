import { NextResponse } from "next/server";
import { getCoinDetail } from "@/lib/coin-detail";

export async function GET(_request: Request, ctx: RouteContext<"/api/coins/[address]">) {
  const { address } = await ctx.params;

  try {
    const detail = await getCoinDetail(address);
    if (!detail) {
      return NextResponse.json({ error: "Coin not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to evaluate coin" },
      { status: 502 },
    );
  }
}
