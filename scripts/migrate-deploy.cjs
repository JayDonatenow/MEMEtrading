// `prisma migrate deploy` needs a direct (unpooled) Postgres connection to hold its
// migration advisory lock -- a pooled connection (e.g. Neon/Vercel Postgres's default
// DATABASE_URL) can't hold a session-level lock reliably and just times out (P1002).
// Vercel's Postgres integration also sets an unpooled URL alongside the pooled one;
// use that for this step only, and fall back to DATABASE_URL when it's not set
// (e.g. local dev against a plain, non-pooled Postgres instance).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- plain CommonJS script run directly via `node`
const { spawnSync } = require("node:child_process");

const directUrl =
  process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: directUrl },
});

process.exit(result.status ?? 1);
