"use client";

import type { CalendarDayFare } from "@/lib/types";

export function CalendarStrip({
  days,
  selected,
  onSelect,
}: {
  days: CalendarDayFare[];
  selected: string;
  onSelect: (date: string) => void;
}) {
  if (!days.length) return null;
  const min = Math.min(...days.map((d) => d.minPriceCny));

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-2">
        {days.map((day) => {
          const isSel = day.date === selected;
          const isBest = day.minPriceCny === min;
          const label = new Date(`${day.date}T12:00:00+08:00`).toLocaleDateString(
            "zh-CN",
            { month: "numeric", day: "numeric", weekday: "short" },
          );
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelect(day.date)}
              className={`min-w-[88px] px-3 py-3 text-left transition ${
                isSel
                  ? "bg-ink-900 text-foam"
                  : "bg-white/70 text-ink-800 hover:bg-white"
              }`}
            >
              <div className="text-[11px] opacity-70">{label}</div>
              <div className="mt-1 font-display text-lg">
                ¥{Math.round(day.minPriceCny / 10) * 10}
              </div>
              <div
                className={`mt-1 text-[11px] ${
                  isBest ? "text-amber-400" : isSel ? "text-skyline-300" : "text-skyline-600"
                }`}
              >
                值 {day.bestValueScore}
                {day.directAvailable ? " · 直" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
