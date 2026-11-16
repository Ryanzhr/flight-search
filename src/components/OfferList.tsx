"use client";

import type { RankedOffer } from "@/lib/types";
import { Sparkline } from "./Sparkline";
import { ValueMeter } from "./ValueMeter";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  });
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export function OfferList({
  offers,
  onAlert,
}: {
  offers: RankedOffer[];
  onAlert: (offer: RankedOffer) => void;
}) {
  if (!offers.length) {
    return (
      <p className="py-16 text-center text-ink-700/70">暂无结果，换个日期试试。</p>
    );
  }

  return (
    <ul className="divide-y divide-ink-900/8">
      {offers.map((offer, idx) => {
        const first = offer.segments[0];
        const last = offer.segments[offer.segments.length - 1];
        return (
          <li
            key={offer.id}
            className="grid gap-4 py-6 transition hover:bg-white/60 md:grid-cols-[88px_1.4fr_1fr_140px] md:items-center"
            style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
          >
            <ValueMeter score={offer.value.total} />

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-display text-xl text-ink-900">
                  {fmtTime(first.departAt)}
                  <span className="mx-2 text-ink-700/40">→</span>
                  {fmtTime(last.arriveAt)}
                </span>
                <span className="text-sm text-ink-700/60">
                  {fmtDuration(offer.durationMin)} ·{" "}
                  {offer.stops === 0 ? "直飞" : `${offer.stops} 次中转`}
                </span>
              </div>
              <p className="text-sm text-ink-800">
                {first.airlineName} {offer.segments.map((s) => s.flightNo).join(" + ")}
                <span className="mx-2 text-ink-700/30">·</span>
                {offer.sourceLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {offer.badges.map((b) => (
                  <span
                    key={b}
                    className="text-xs tracking-wide text-skyline-600 underline decoration-skyline-300/60 underline-offset-4"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-700/65">
                {offer.value.reasons.slice(0, 2).join(" · ")}
              </p>
            </div>

            <div className="text-sm text-ink-700/75">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span>有效成本</span>
                <strong className="text-ink-900">
                  ¥{offer.value.effectiveCostCny.toLocaleString("zh-CN")}
                </strong>
              </div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span>历史分位</span>
                <span>低于 {100 - offer.priceVsHistoryPct}% 观测</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-skyline-600">
                <Sparkline values={offer.sparkline} />
                <span className="text-[11px]">近窗波动</span>
              </div>
              <p className="mt-2 text-[11px] text-ink-700/50">
                行李 {offer.baggageKg}kg
                {offer.refundable ? " · 可退" : " · 限制退票"}
                {offer.changeable ? " · 可改期" : ""}
              </p>
            </div>

            <div className="text-right">
              <div className="font-display text-3xl text-ink-900">
                ¥{offer.priceCny.toLocaleString("zh-CN")}
              </div>
              <button
                type="button"
                onClick={() => onAlert(offer)}
                className="mt-2 text-xs tracking-wide text-skyline-600 underline underline-offset-4 hover:text-ink-900"
              >
                低于此价提醒
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
