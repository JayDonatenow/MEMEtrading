import type { ScoreBreakdownItem } from "@/lib/safety-score";

const STATUS_STYLES: Record<ScoreBreakdownItem["status"], string> = {
  good: "bg-emerald-500",
  warning: "bg-orange-500",
  unknown: "bg-zinc-600",
};

const STATUS_ICON: Record<ScoreBreakdownItem["status"], string> = {
  good: "✅",
  warning: "⚠️",
  unknown: "❔",
};

export function ScoreBreakdown({ items }: { items: ScoreBreakdownItem[] }) {
  const totalPossible = items.reduce((sum, i) => sum + i.possible, 0);
  const totalEarned = items.reduce((sum, i) => sum + i.earned, 0);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span>{STATUS_ICON[item.status]}</span>
              {item.label}
            </span>
            <span className="text-zinc-500">
              {Math.round(item.earned)}/{item.possible} pts
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${STATUS_STYLES[item.status]}`}
              style={{ width: `${item.possible > 0 ? (item.earned / item.possible) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{item.detail}</p>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm font-semibold text-zinc-200">
        <span>Total</span>
        <span>
          {Math.round(totalEarned)}/{totalPossible} pts
        </span>
      </div>
    </div>
  );
}
