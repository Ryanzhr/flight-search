"use client";

import { AIRPORTS } from "@/lib/airports";

export type SearchFormState = {
  origin: string;
  destination: string;
  departDate: string;
  adults: number;
  cabin: "economy" | "premium" | "business";
  hourlyValueCny: number;
  preferDirect: boolean;
};

export function defaultForm(): SearchFormState {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return {
    origin: "PEK",
    destination: "SHA",
    departDate: d.toISOString().slice(0, 10),
    adults: 1,
    cabin: "economy",
    hourlyValueCny: 80,
    preferDirect: false,
  };
}

export function SearchPanel({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: SearchFormState;
  onChange: (next: SearchFormState) => void;
  onSubmit: () => void;
  loading?: boolean;
}) {
  const set = <K extends keyof SearchFormState>(key: K, v: SearchFormState[K]) =>
    onChange({ ...value, [key]: v });

  const swap = () =>
    onChange({ ...value, origin: value.destination, destination: value.origin });

  return (
    <form
      className="grid w-full gap-3 md:grid-cols-[1.1fr_auto_1.1fr_1fr_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-skyline-300">
          出发
        </span>
        <select
          className="w-full border-0 border-b border-white/25 bg-transparent pb-2 text-lg text-foam outline-none transition focus:border-amber-400"
          value={value.origin}
          onChange={(e) => set("origin", e.target.value)}
        >
          {AIRPORTS.map((a) => (
            <option key={a.code} value={a.code} className="text-ink-900">
              {a.city} {a.code}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={swap}
        className="mb-1 hidden h-10 w-10 items-center justify-center self-end rounded-full border border-white/20 text-foam transition hover:border-amber-400 hover:text-amber-300 md:inline-flex"
        aria-label="交换起降地"
      >
        ⇄
      </button>

      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-skyline-300">
          到达
        </span>
        <select
          className="w-full border-0 border-b border-white/25 bg-transparent pb-2 text-lg text-foam outline-none transition focus:border-amber-400"
          value={value.destination}
          onChange={(e) => set("destination", e.target.value)}
        >
          {AIRPORTS.map((a) => (
            <option key={a.code} value={a.code} className="text-ink-900">
              {a.city} {a.code}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-skyline-300">
          出发日期
        </span>
        <input
          type="date"
          className="w-full border-0 border-b border-white/25 bg-transparent pb-2 text-lg text-foam outline-none transition focus:border-amber-400 [color-scheme:dark]"
          value={value.departDate}
          onChange={(e) => set("departDate", e.target.value)}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-amber-400 px-7 py-3 text-sm font-semibold tracking-wide text-ink-950 transition hover:bg-amber-300 disabled:opacity-60 md:mt-0"
      >
        {loading ? "比价中…" : "搜高性价比"}
      </button>

      <div className="col-span-full mt-2 flex flex-wrap gap-4 text-sm text-white/75">
        <label className="inline-flex items-center gap-2">
          <span>时薪估值 ¥</span>
          <input
            type="number"
            min={20}
            max={500}
            className="w-16 border-b border-white/25 bg-transparent pb-0.5 outline-none focus:border-amber-400"
            value={value.hourlyValueCny}
            onChange={(e) => set("hourlyValueCny", Number(e.target.value) || 80)}
          />
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.preferDirect}
            onChange={(e) => set("preferDirect", e.target.checked)}
          />
          偏好直飞
        </label>
        <label className="inline-flex items-center gap-2">
          <span>舱位</span>
          <select
            className="bg-transparent outline-none"
            value={value.cabin}
            onChange={(e) =>
              set("cabin", e.target.value as SearchFormState["cabin"])
            }
          >
            <option value="economy" className="text-ink-900">
              经济舱
            </option>
            <option value="premium" className="text-ink-900">
              超级经济舱
            </option>
            <option value="business" className="text-ink-900">
              公务舱
            </option>
          </select>
        </label>
      </div>
    </form>
  );
}
