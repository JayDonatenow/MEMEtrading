import { NextResponse } from "next/server";
import { discoverFreshSolanaPairs } from "@/lib/dexscreener";
import { quickEvaluate, pairAgeMinutes } from "@/lib/evaluate-coin";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const pairs = await discoverFreshSolanaPairs();

    const coins = await Promise.all(
      pairs.slice(0, 40).map(async (pair) => {
        const { score, label, reasons } = quickEvaluate(pair);

        await prisma.coin.upsert({
          where: { mintAddress: pair.baseToken.address },
          create: {
            mintAddress: pair.baseToken.address,
            pairAddress: pair.pairAddress,
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name,
            imageUrl: pair.info?.imageUrl,
            pairCreatedAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt) : null,
            priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
            liquidityUsd: pair.liquidity?.usd ?? null,
            marketCapUsd: pair.marketCap ?? null,
            volume24hUsd: pair.volume?.h24 ?? null,
            safetyScore: score,
            scoreLabel: label,
          },
          update: {
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name,
            imageUrl: pair.info?.imageUrl,
            priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
            liquidityUsd: pair.liquidity?.usd ?? null,
            marketCapUsd: pair.marketCap ?? null,
            volume24hUsd: pair.volume?.h24 ?? null,
            safetyScore: score,
            scoreLabel: label,
          },
        });

        return {
          mintAddress: pair.baseToken.address,
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          imageUrl: pair.info?.imageUrl ?? null,
          priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
          liquidityUsd: pair.liquidity?.usd ?? null,
          marketCapUsd: pair.marketCap ?? null,
          volume24hUsd: pair.volume?.h24 ?? null,
          ageMinutes: pairAgeMinutes(pair),
          priceChange24h: pair.priceChange?.h24 ?? null,
          safetyScore: score,
          scoreLabel: label,
          reasons,
        };
      }),
    );

    coins.sort((a, b) => (b.safetyScore ?? 0) - (a.safetyScore ?? 0));

    return NextResponse.json({ coins });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load coins" },
      { status: 502 },
    );
  }
}
