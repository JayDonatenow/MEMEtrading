# MEMEtrading

Meme coin detector to prevent rugs. See [PROJECT.md](./PROJECT.md) for the full project spec.

A Next.js app that surfaces fresh Solana meme coins, scores them for rug-pull risk (Safety %), and surfaces relevant X (Twitter) activity per coin.

## Getting Started

Copy the env file and fill in what you have (see comments in the file for what's required vs. optional):

```bash
cp .env.example .env
```

Set up the database and run the dev server:

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deploying (Vercel)

1. Import this repo into Vercel and deploy the branch with the app on it.
2. In the project's Storage tab, add a Postgres database — this sets `DATABASE_URL` automatically.
3. Optionally set `SOLANA_RPC_URL`, `X_BEARER_TOKEN`, and `CRON_SECRET` (see `.env.example`).
4. Redeploy. `npm install` runs `prisma generate` automatically (`postinstall` script), and the
   `build` script runs `prisma migrate deploy` before `next build` so the database schema is
   created/updated on every deploy.

## Tech Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + Postgres for coin safety-score history and watchlists
- DexScreener public API for Solana pair/coin discovery
- Solana web3.js for on-chain safety checks (mint/freeze authority, holder concentration)
- X API v2 for coin-relevant tweets
