"use client";

export function ValueMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="value-ring grid h-14 w-14 place-items-center rounded-full p-[3px]"
        style={{ ["--score" as string]: `${pct}%` }}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-ink-900 text-foam">
          <span className="font-display text-lg leading-none">{score.toFixed(0)}</span>
        </div>
      </div>
      <span className="text-[11px] tracking-wide text-skyline-300">性价比</span>
    </div>
  );
}
