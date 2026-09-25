-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Coin" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'solana',
    "mintAddress" TEXT NOT NULL,
    "pairAddress" TEXT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pairCreatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "priceUsd" DOUBLE PRECISION,
    "liquidityUsd" DOUBLE PRECISION,
    "marketCapUsd" DOUBLE PRECISION,
    "volume24hUsd" DOUBLE PRECISION,
    "safetyScore" INTEGER,
    "scoreLabel" TEXT,

    CONSTRAINT "Coin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyScoreSnapshot" (
    "id" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "liquidityUsd" DOUBLE PRECISION,
    "topHolderPct" DOUBLE PRECISION,
    "clusteredPct" DOUBLE PRECISION,
    "mintRevoked" BOOLEAN,
    "freezeRevoked" BOOLEAN,
    "lpBurnedOrLocked" BOOLEAN,
    "events" TEXT,

    CONSTRAINT "SafetyScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "anonId" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alertBelowScore" INTEGER,
    "notifyEmail" TEXT,
    "lastAlertedAt" TIMESTAMP(3),

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "SafetyScoreSnapshot" ADD CONSTRAINT "SafetyScoreSnapshot_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

