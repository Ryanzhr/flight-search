"use client";

import type { SourceStatus } from "@/lib/types";

const tone: Record<SourceStatus["status"], string> = {
  live: "bg-emerald-400",
  demo: "bg-skyline-400",
  degraded: "bg-amber-400",
  offline: "bg-ink-700/40",
};

export function SourceRail({ sources }: { sources: SourceStatus[] }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {sources.map((s) => (
        <div key={s.id} className="min-w-[140px]">
          <div className="flex items-center gap-2 text-sm text-ink-900">
            <span className={`h-2 w-2 rounded-full ${tone[s.status]} animate-pulseDot`} />
            {s.label}
          </div>
          <p className="mt-1 text-[11px] text-ink-700/55">
            {s.region} · {s.latencyMs}ms · {s.detail}
          </p>
        </div>
      ))}
    </div>
  );
}
