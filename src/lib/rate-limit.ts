import { prisma } from "@/lib/db";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

// A simple Postgres-backed sliding-window-ish rate limiter (fixed window, reset on expiry).
// Not perfectly race-free under heavy concurrent load on the same key, but that's an
// acceptable tradeoff for "stop obvious spam scripts" rather than a hard security boundary.
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({ where: { key } });

    if (!existing || now.getTime() - existing.windowStart.getTime() > windowMs) {
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return { allowed: true, remaining: limit - 1 };
    }

    if (existing.count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    await tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return { allowed: true, remaining: limit - existing.count - 1 };
  });
}
