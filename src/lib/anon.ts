import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE_NAME = "memetrading_anon_id";

// Anonymous per-browser ID used to scope watchlist items without requiring an account.
export async function getOrCreateAnonId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}
