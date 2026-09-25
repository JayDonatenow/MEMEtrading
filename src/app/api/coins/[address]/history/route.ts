import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { SafetyScoreSnapshotModel } from "@/generated/prisma/models";

export async function GET(_request: Request, ctx: RouteContext<"/api/coins/[address]/history">) {
  const { address } = await ctx.params;

  const coin = await prisma.coin.findUnique({ where: { mintAddress: address } });
  if (!coin) {
    return NextResponse.json({ history: [] });
  }

  const snapshots = await prisma.safetyScoreSnapshot.findMany({
    where: { coinId: coin.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    history: snapshots.map((s: SafetyScoreSnapshotModel) => ({
      createdAt: s.createdAt.toISOString(),
      score: s.score,
      liquidityUsd: s.liquidityUsd,
      topHolderPct: s.topHolderPct,
      clusteredPct: s.clusteredPct,
      events: s.events ? (JSON.parse(s.events) as string[]) : [],
    })),
  });
}
