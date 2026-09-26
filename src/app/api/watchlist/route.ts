import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAnonId } from "@/lib/anon";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CoinModel, WatchlistItemModel } from "@/generated/prisma/models";

export async function GET() {
  const anonId = await getOrCreateAnonId();

  const items = await prisma.watchlistItem.findMany({
    where: { anonId },
    include: { coin: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: items.map((i: WatchlistItemModel & { coin: CoinModel }) => ({
      id: i.id,
      alertBelowScore: i.alertBelowScore,
      notifyEmail: i.notifyEmail,
      coin: {
        mintAddress: i.coin.mintAddress,
        symbol: i.coin.symbol,
        name: i.coin.name,
        imageUrl: i.coin.imageUrl,
        safetyScore: i.coin.safetyScore,
        scoreLabel: i.coin.scoreLabel,
      },
    })),
  });
}

const addSchema = z.object({
  mintAddress: z.string().min(32).max(64),
  alertBelowScore: z.number().int().min(0).max(100).nullable().optional(),
  notifyEmail: z.string().email().nullable().optional(),
});

export async function POST(request: Request) {
  const anonId = await getOrCreateAnonId();

  const { allowed } = await checkRateLimit(`watchlist-post:${anonId}`, 20, 10 * 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many watchlist changes — try again in a few minutes" },
      { status: 429 },
    );
  }

  const body = addSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const coin = await prisma.coin.findUnique({ where: { mintAddress: body.data.mintAddress } });
  if (!coin) {
    return NextResponse.json({ error: "Unknown coin — view it once before watching it" }, { status: 404 });
  }

  const existingCount = await prisma.watchlistItem.count({ where: { anonId } });
  if (existingCount >= 200) {
    return NextResponse.json({ error: "Watchlist limit reached (200 coins)" }, { status: 429 });
  }

  const item = await prisma.watchlistItem.upsert({
    where: { anonId_coinId: { anonId, coinId: coin.id } },
    create: {
      anonId,
      coinId: coin.id,
      alertBelowScore: body.data.alertBelowScore ?? null,
      notifyEmail: body.data.notifyEmail ?? null,
    },
    update: {
      alertBelowScore: body.data.alertBelowScore ?? null,
      notifyEmail: body.data.notifyEmail ?? null,
    },
  });

  return NextResponse.json({ id: item.id });
}

const deleteSchema = z.object({ mintAddress: z.string() });

export async function DELETE(request: Request) {
  const anonId = await getOrCreateAnonId();
  const body = deleteSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const coin = await prisma.coin.findUnique({ where: { mintAddress: body.data.mintAddress } });
  if (!coin) {
    return NextResponse.json({ ok: true });
  }

  await prisma.watchlistItem.deleteMany({ where: { anonId, coinId: coin.id } });
  return NextResponse.json({ ok: true });
}
