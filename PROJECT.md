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

## Goals
- Help users catch new meme coins early, before major price runs.
- Reduce risk of losing money to rug pulls by surfacing safety signals clearly.
- Combine on-chain/market data with social signal (X/Twitter) in one place.

## Open Questions / To Decide
- Which meme coin data API(s) to use (chain(s) supported, rate limits, cost)?
- Which blockchain(s) to support first (Solana, Ethereum, Base, etc.)?
- Exact rug-detection criteria/scoring formula.
- X API access tier needed (search/filtered stream) and cost.
- Tech stack (frontend framework, backend, hosting).
- Real-time updates vs. periodic refresh.

## Tech Stack
_TBD_

## Notes
_(Add more details here as we go)_
