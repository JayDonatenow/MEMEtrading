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

export interface ScoreBreakdownItem {
  label: string;
  earned: number;
  possible: number;
  status: "good" | "warning" | "unknown";
  detail: string;
}

export interface SafetyScoreResult {
  score: number; // 0-100
  label: "Danger" | "Risky" | "Caution" | "Safer";
  reasons: string[]; // human-readable factors that moved the score
  breakdown: ScoreBreakdownItem[]; // every factor, including ones that scored full/zero/unknown
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
  const breakdown: ScoreBreakdownItem[] = [];

  if (input.mintAuthorityRevoked) {
    score += WEIGHTS.mintAuthority;
    breakdown.push({
      label: "Mint authority",
      earned: WEIGHTS.mintAuthority,
      possible: WEIGHTS.mintAuthority,
      status: "good",
      detail: "Renounced — supply is fixed",
    });
  } else if (input.mintAuthorityRevoked === false) {
    reasons.push("Mint authority is still active — supply can be inflated at any time");
    breakdown.push({
      label: "Mint authority",
      earned: 0,
      possible: WEIGHTS.mintAuthority,
      status: "warning",
      detail: "Still active — supply can be inflated",
    });
  } else {
    breakdown.push({
      label: "Mint authority",
      earned: 0,
      possible: WEIGHTS.mintAuthority,
      status: "unknown",
      detail: "Couldn't be determined",
    });
  }

  if (input.freezeAuthorityRevoked) {
    score += WEIGHTS.freezeAuthority;
    breakdown.push({
      label: "Freeze authority",
      earned: WEIGHTS.freezeAuthority,
      possible: WEIGHTS.freezeAuthority,
      status: "good",
      detail: "Renounced — wallets can't be frozen",
    });
  } else if (input.freezeAuthorityRevoked === false) {
    reasons.push("Freeze authority is still active — holder wallets can be frozen");
    breakdown.push({
      label: "Freeze authority",
      earned: 0,
      possible: WEIGHTS.freezeAuthority,
      status: "warning",
      detail: "Still active — wallets can be frozen",
    });
  } else {
    breakdown.push({
      label: "Freeze authority",
      earned: 0,
      possible: WEIGHTS.freezeAuthority,
      status: "unknown",
      detail: "Couldn't be determined",
    });
  }

  if (input.liquidityUsd !== null) {
    let earned = 0;
    let detail: string;
    if (input.liquidityUsd >= 50_000) {
      earned = WEIGHTS.liquidity;
      detail = "Strong liquidity";
    } else if (input.liquidityUsd >= 15_000) {
      earned = WEIGHTS.liquidity * 0.6;
      detail = "Moderate liquidity";
    } else if (input.liquidityUsd >= 5_000) {
      earned = WEIGHTS.liquidity * 0.3;
      detail = "Thin liquidity";
    } else {
      detail = "Very low liquidity — easy to manipulate or drain";
      reasons.push("Very low liquidity — easy to manipulate or drain");
    }
    score += earned;
    breakdown.push({
      label: "Liquidity",
      earned,
      possible: WEIGHTS.liquidity,
      status: earned === WEIGHTS.liquidity ? "good" : earned > 0 ? "warning" : "warning",
      detail,
    });
  } else {
    breakdown.push({ label: "Liquidity", earned: 0, possible: WEIGHTS.liquidity, status: "unknown", detail: "No data" });
  }

  if (input.topHolderPct !== null) {
    let earned = 0;
    let detail: string;
    if (input.topHolderPct <= 5) {
      earned = WEIGHTS.topHolder;
      detail = `Top holder owns ${input.topHolderPct.toFixed(1)}%`;
    } else if (input.topHolderPct <= 10) {
      earned = WEIGHTS.topHolder * 0.6;
      detail = `Top holder owns ${input.topHolderPct.toFixed(1)}%`;
    } else if (input.topHolderPct <= 20) {
      earned = WEIGHTS.topHolder * 0.3;
      detail = `Top holder owns ${input.topHolderPct.toFixed(1)}%`;
    } else {
      detail = `Top holder controls ${input.topHolderPct.toFixed(1)}% of supply`;
      reasons.push(`Top holder controls ${input.topHolderPct.toFixed(1)}% of supply`);
    }
    score += earned;
    breakdown.push({
      label: "Top holder concentration",
      earned,
      possible: WEIGHTS.topHolder,
      status: earned === WEIGHTS.topHolder ? "good" : "warning",
      detail,
    });
  } else {
    breakdown.push({ label: "Top holder concentration", earned: 0, possible: WEIGHTS.topHolder, status: "unknown", detail: "No data" });
  }

  if (input.clusteredPct !== null) {
    let earned = 0;
    let detail: string;
    if (input.clusteredPct <= 5) {
      earned = WEIGHTS.clustering;
      detail = "No linked-wallet clustering detected";
    } else if (input.clusteredPct <= 15) {
      earned = WEIGHTS.clustering * 0.5;
      detail = `${input.clusteredPct.toFixed(1)}% of top holders appear linked`;
    } else {
      detail = `${input.clusteredPct.toFixed(1)}% of top holders appear linked to one wallet`;
      reasons.push(`${input.clusteredPct.toFixed(1)}% of top holders appear linked to one wallet`);
    }
    score += earned;
    breakdown.push({
      label: "Wallet clustering",
      earned,
      possible: WEIGHTS.clustering,
      status: earned === WEIGHTS.clustering ? "good" : "warning",
      detail,
    });
  } else {
    breakdown.push({ label: "Wallet clustering", earned: 0, possible: WEIGHTS.clustering, status: "unknown", detail: "No data" });
  }

  if (input.buySellRatio24h !== null) {
    const earned = input.buySellRatio24h >= 0.45 ? WEIGHTS.buyPressure : 0;
    if (earned === 0) reasons.push("Sell pressure outweighs buy pressure over the last 24h");
    score += earned;
    breakdown.push({
      label: "24h buy/sell pressure",
      earned,
      possible: WEIGHTS.buyPressure,
      status: earned > 0 ? "good" : "warning",
      detail: `${Math.round(input.buySellRatio24h * 100)}% of 24h transactions are buys`,
    });
  } else {
    breakdown.push({ label: "24h buy/sell pressure", earned: 0, possible: WEIGHTS.buyPressure, status: "unknown", detail: "No data" });
  }

  if (input.lpBurnedOrLocked) {
    score += WEIGHTS.lpLocked;
    breakdown.push({
      label: "Liquidity lock",
      earned: WEIGHTS.lpLocked,
      possible: WEIGHTS.lpLocked,
      status: "good",
      detail: "Locked or burned — can't be pulled",
    });
  } else if (input.lpBurnedOrLocked === false) {
    reasons.push("Liquidity isn't locked or burned — it can be pulled at any time");
    breakdown.push({
      label: "Liquidity lock",
      earned: 0,
      possible: WEIGHTS.lpLocked,
      status: "warning",
      detail: "Not locked — can be pulled at any time",
    });
  } else {
    breakdown.push({ label: "Liquidity lock", earned: 0, possible: WEIGHTS.lpLocked, status: "unknown", detail: "Couldn't be determined" });
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

  return { score, label, reasons, breakdown };
}
