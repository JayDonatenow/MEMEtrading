export interface SafetyScoreInput {
  liquidityUsd: number | null;
  ageMinutes: number | null;
  mintAuthorityRevoked: boolean | null;
  freezeAuthorityRevoked: boolean | null;
  topHolderPct: number | null; // largest single non-LP holder, %
  clusteredPct: number | null; // % of top holders that appear linked to one funder
  buySellRatio24h: number | null; // buys / (buys + sells), 0-1
  lpBurnedOrLocked: boolean | null; // liquidity pool tokens burned/protocol-locked vs. dev-withdrawable
}

export interface SafetyScoreResult {
  score: number; // 0-100
  label: "Danger" | "Risky" | "Caution" | "Safer";
  reasons: string[]; // human-readable factors that moved the score
}

const WEIGHTS = {
  mintAuthority: 25,
  freezeAuthority: 15,
  liquidity: 20,
  topHolder: 15,
  clustering: 10,
  buyPressure: 5,
  lpLocked: 10,
};

// A simple, explainable rule-based scorer (not ML) so every point can be traced to a signal.
// Intentionally conservative: missing data never helps the score, only known-good signals do.
export function computeSafetyScore(input: SafetyScoreInput): SafetyScoreResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.mintAuthorityRevoked) {
    score += WEIGHTS.mintAuthority;
  } else if (input.mintAuthorityRevoked === false) {
    reasons.push("Mint authority is still active — supply can be inflated at any time");
  }

  if (input.freezeAuthorityRevoked) {
    score += WEIGHTS.freezeAuthority;
  } else if (input.freezeAuthorityRevoked === false) {
    reasons.push("Freeze authority is still active — holder wallets can be frozen");
  }

  if (input.liquidityUsd !== null) {
    if (input.liquidityUsd >= 50_000) score += WEIGHTS.liquidity;
    else if (input.liquidityUsd >= 15_000) score += WEIGHTS.liquidity * 0.6;
    else if (input.liquidityUsd >= 5_000) score += WEIGHTS.liquidity * 0.3;
    else reasons.push("Very low liquidity — easy to manipulate or drain");
  }

  if (input.topHolderPct !== null) {
    if (input.topHolderPct <= 5) score += WEIGHTS.topHolder;
    else if (input.topHolderPct <= 10) score += WEIGHTS.topHolder * 0.6;
    else if (input.topHolderPct <= 20) score += WEIGHTS.topHolder * 0.3;
    else reasons.push(`Top holder controls ${input.topHolderPct.toFixed(1)}% of supply`);
  }

  if (input.clusteredPct !== null) {
    if (input.clusteredPct <= 5) score += WEIGHTS.clustering;
    else if (input.clusteredPct <= 15) score += WEIGHTS.clustering * 0.5;
    else reasons.push(`${input.clusteredPct.toFixed(1)}% of top holders appear linked to one wallet`);
  }

  if (input.buySellRatio24h !== null) {
    if (input.buySellRatio24h >= 0.45) score += WEIGHTS.buyPressure;
    else reasons.push("Sell pressure outweighs buy pressure over the last 24h");
  }

  if (input.lpBurnedOrLocked) {
    score += WEIGHTS.lpLocked;
  } else if (input.lpBurnedOrLocked === false) {
    reasons.push("Liquidity isn't locked or burned — it can be pulled at any time");
  }

  // Very fresh coins (under ~10 min old) haven't had time to prove anything yet — cap the
  // score so "new" never reads as "safe" purely from the other signals looking clean.
  if (input.ageMinutes !== null && input.ageMinutes < 10) {
    score = Math.min(score, 60);
    reasons.push("Coin is brand new — safety signals are still thin");
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  const label: SafetyScoreResult["label"] =
    score >= 75 ? "Safer" : score >= 50 ? "Caution" : score >= 25 ? "Risky" : "Danger";

  return { score, label, reasons };
}
