-- CreateTable
CREATE TABLE "Coin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chain" TEXT NOT NULL DEFAULT 'solana',
    "mintAddress" TEXT NOT NULL,
    "pairAddress" TEXT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pairCreatedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "priceUsd" REAL,
    "liquidityUsd" REAL,
    "marketCapUsd" REAL,
    "volume24hUsd" REAL,
    "safetyScore" INTEGER,
    "scoreLabel" TEXT
);

-- CreateTable
CREATE TABLE "SafetyScoreSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coinId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "liquidityUsd" REAL,
    "topHolderPct" REAL,
    "clusteredPct" REAL,
    "mintRevoked" BOOLEAN,
    "freezeRevoked" BOOLEAN,
    "lpBurnedOrLocked" BOOLEAN,
    "events" TEXT,
    CONSTRAINT "SafetyScoreSnapshot_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anonId" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alertBelowScore" INTEGER,
    "notifyEmail" TEXT,
    "lastAlertedAt" DATETIME,
    CONSTRAINT "WatchlistItem_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Coin_mintAddress_key" ON "Coin"("mintAddress");

-- CreateIndex
CREATE INDEX "Coin_safetyScore_idx" ON "Coin"("safetyScore");

-- CreateIndex
CREATE INDEX "Coin_pairCreatedAt_idx" ON "Coin"("pairCreatedAt");

-- CreateIndex
CREATE INDEX "SafetyScoreSnapshot_coinId_createdAt_idx" ON "SafetyScoreSnapshot"("coinId", "createdAt");

-- CreateIndex
CREATE INDEX "WatchlistItem_anonId_idx" ON "WatchlistItem"("anonId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_anonId_coinId_key" ON "WatchlistItem"("anonId", "coinId");
