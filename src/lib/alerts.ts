// Delivers a watchlist safety-score alert over whichever channel(s) are configured.
// Each channel is optional and independent -- with nothing configured, alerts are just
// logged, so the app still runs (and /api/scan still records that the alert "fired")
// without requiring any of these to be set up.

export interface AlertPayload {
  coinSymbol: string;
  coinName: string;
  mintAddress: string;
  previousScore: number | null;
  currentScore: number;
  threshold: number | null;
  notifyEmail: string | null;
}

function coinUrl(mintAddress: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  const origin = base ? (base.startsWith("http") ? base : `https://${base}`) : "";
  return `${origin}/coin/${mintAddress}`;
}

function buildMessage(payload: AlertPayload): string {
  const drop =
    payload.previousScore !== null
      ? `dropped from ${payload.previousScore}% to ${payload.currentScore}%`
      : `is at ${payload.currentScore}%`;
  const thresholdNote = payload.threshold !== null ? ` (below your ${payload.threshold}% alert threshold)` : "";
  return `⚠️ Safety alert: $${payload.coinSymbol} (${payload.coinName}) ${drop}${thresholdNote}. ${coinUrl(payload.mintAddress)}`;
}

async function sendDiscordAlert(message: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });
  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}`);
  }
}

async function sendEmailAlert(to: string, subject: string, message: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text: message }),
  });
  if (!res.ok) {
    throw new Error(`Resend request failed: ${res.status} ${res.statusText}`);
  }
}

export function isAlertDeliveryConfigured(): boolean {
  return Boolean(process.env.DISCORD_WEBHOOK_URL || (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL));
}

// Sends the alert over every configured channel. Failures are caught per-channel and
// logged rather than thrown, so one bad channel (e.g. a revoked webhook) doesn't stop
// the scan job from processing the rest of the watchlist.
export async function sendAlert(payload: AlertPayload): Promise<void> {
  const message = buildMessage(payload);

  await Promise.all([
    sendDiscordAlert(message).catch((err) => console.error("Discord alert failed:", err)),
    payload.notifyEmail
      ? sendEmailAlert(payload.notifyEmail, `Safety alert: $${payload.coinSymbol}`, message).catch((err) =>
          console.error("Email alert failed:", err),
        )
      : Promise.resolve(),
  ]);

  if (!isAlertDeliveryConfigured()) {
    console.log("[alert]", message, "(no delivery channel configured — see .env.example)");
  }
}
