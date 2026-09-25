# MEMEtrading

## Overview
A website that helps users discover and evaluate meme coins before they rug. On landing, the site pulls real meme coin data from a meme coin trading platform's API, scans each coin for rug-pull risk signals, and displays a **Safety %** score. The primary focus is freshly launched meme coins with high market potential, so users can get in early for higher profit potential while avoiding scams.

## Core Features

### 1. Meme Coin Feed
- On page load, fetch a list of real, currently trading meme coins via a third-party meme coin trading API (e.g. DexScreener, Birdeye, Pump.fun, or similar — TBD).
- Prioritize freshly created coins with signs of high market potential (volume spikes, liquidity growth, holder growth, etc.).
- Display key info per coin: name/ticker, price, market cap, liquidity, age, volume, holder count.

### 2. Rug Pull Detection / Safety Score
- Scan each coin against rug-pull risk indicators, such as:
  - Liquidity lock status / LP burned or not
  - Contract ownership renounced or not
  - Mint authority / freeze authority status
  - Holder concentration (top wallet %)
  - Honeypot / sell-tax checks
  - Dev wallet behavior (sudden large sells)
- Combine signals into a single **Safety %** score shown on each coin's card/listing.

### 3. X (Twitter) Integration
- Add a section/option per coin (or globally) that shows relevant tweets that could impact that coin's value.
- Pull tweets via X API filtered by coin name/ticker/contract address.
- Surface sentiment or relevance to help users gauge hype/momentum.

### 4. Alerts / Watchlist
- Users can save/watch a coin, or set a safety-score threshold (e.g. alert me on any fresh coin scoring above 80%).
- Notify when:
  - A watched coin's safety score drops significantly (early rug warning).
  - A new coin matching saved criteria appears.
- Delivery channels: push notification, email, and/or Discord/Telegram webhook (TBD which to build first).

### 5. Historical Safety Tracking
- Don't just show a point-in-time safety %— track it over time per coin.
- Store a timeline of score changes and the specific events that drove them (e.g. "liquidity unlocked," "dev wallet sold 15%," "mint authority re-enabled").
- Display a simple trend/graph on each coin's detail view so users can see if a coin is getting safer or riskier, not just its current state.
- This is what actually powers the Alerts feature above (a score-drop alert needs a history to compare against).

### 6. Wallet / Dev Clustering
- Detect when holder wallets that look independent are actually linked to the same dev/insider (common pre-rug pattern: distributing supply across wallets to hide concentration).
- Heuristics to explore: shared funding source (all wallets funded from the same origin wallet), correlated transaction timing, common wallet creation patterns.
- Feed clustering results into the Safety % score as a stronger signal than raw top-holder-% alone, and surface it explicitly (e.g. "40% of supply held by wallets linked to 1 entity").

## Goals
- Help users catch new meme coins early, before major price runs.
- Reduce risk of losing money to rug pulls by surfacing safety signals clearly.
- Combine on-chain/market data with social signal (X/Twitter) in one place.

## Open Questions / To Decide
- Real-time updates vs. periodic refresh (currently client polls every 60s; consider websockets/SSE later).
- How often an external cron should hit `/api/scan` to re-check watched coins (not yet scheduled — needs a cron trigger, e.g. Vercel Cron, wired up).
- Wallet clustering heuristics: what data source(s) give funding-source/transaction-timing data cheaply enough at scale (current approach is best-effort against public Solana RPC and rate-limits easily).
- Push notifications for alerts (currently Discord webhook + email via Resend; no push channel yet).

## Tech Stack
- Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel
- Prisma + Postgres (Neon via Vercel's Postgres integration)
- DexScreener public API (token-profiles/token-boosts for discovery, tokens/v1 for market data)
- Solana web3.js for on-chain safety checks
- X API v2 for coin-relevant tweets
- Discord webhook + Resend for watchlist alert delivery

## Notes
_(Add more details here as we go)_
