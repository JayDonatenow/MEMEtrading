const STYLES: Record<string, string> = {
  Safer: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Caution: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Risky: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Danger: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function SafetyBadge({ score, label }: { score: number; label: string }) {
  const style = STYLES[label] ?? STYLES.Danger;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold ${style}`}>
      {score}% <span className="font-normal opacity-80">{label}</span>
    </span>
  );
}
