import { NextResponse } from "next/server";
import { getPairsForTokens } from "@/lib/dexscreener";
import { fullEvaluate } from "@/lib/evaluate-coin";
import { prisma } from "@/lib/db";

// Re-scans every coin on at least one watchlist and snapshots its safety score, flagging
// any watchlist item whose alert threshold was crossed. Intended to be hit periodically by
// an external cron (e.g. Vercel Cron) with a shared secret, not called from the browser.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("authorization")?.replace("Bearer ", "");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const watchedCoins = await prisma.coin.findMany({
    where: { watchlistItems: { some: {} } },
    include: { watchlistItems: true },
  });

  if (watchedCoins.length === 0) {
    return NextResponse.json({ scanned: 0, alertsTriggered: 0 });
  }

  const pairs = await getPairsForTokens(watchedCoins.map((c: { mintAddress: string }) => c.mintAddress));
  const pairByMint = new Map(pairs.map((p) => [p.baseToken.address, p]));

  let alertsTriggered = 0;

  for (const coin of watchedCoins) {
    const pair = pairByMint.get(coin.mintAddress);
    if (!pair) continue;

    const evaluation = await fullEvaluate(pair);

    await prisma.coin.update({
      where: { id: coin.id },
      data: { safetyScore: evaluation.score.score, scoreLabel: evaluation.score.label },
    });

    await prisma.safetyScoreSnapshot.create({
      data: {
        coinId: coin.id,
        score: evaluation.score.score,
        liquidityUsd: pair.liquidity?.usd ?? null,
        topHolderPct: evaluation.topHolderPct,
        clusteredPct: evaluation.clusteredPct,
        mintRevoked: evaluation.mintAuthorityRevoked,
        freezeRevoked: evaluation.freezeAuthorityRevoked,
      },
    });

    for (const item of coin.watchlistItems) {
      const threshold = item.alertBelowScore;
      const crossed = threshold !== null && evaluation.score.score < threshold;
      if (crossed) {
        alertsTriggered += 1;
        await prisma.watchlistItem.update({
          where: { id: item.id },
          data: { lastAlertedAt: new Date() },
        });
        // TODO: wire up actual delivery (email/push/Discord/Telegram) once a channel is chosen —
        // see PROJECT.md open questions. For now this just records that the alert fired.
      }
    }
  }

  return NextResponse.json({ scanned: watchedCoins.length, alertsTriggered });
}
