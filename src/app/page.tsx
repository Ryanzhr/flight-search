"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { popularRoutes } from "@/lib/airports";
import type {
  CalendarDayFare,
  PriceTrendPoint,
  SearchResponse,
  SourceStatus,
} from "@/lib/types";
import { CalendarStrip } from "@/components/CalendarStrip";
import { OfferList } from "@/components/OfferList";
import {
  SearchPanel,
  defaultForm,
  type SearchFormState,
} from "@/components/SearchPanel";
import { SourceRail } from "@/components/SourceRail";
import { TrendChart } from "@/components/TrendChart";

export default function Home() {
  const [form, setForm] = useState<SearchFormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [calendar, setCalendar] = useState<CalendarDayFare[]>([]);
  const [trends, setTrends] = useState<PriceTrendPoint[]>([]);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const loadSide = useCallback(async (f: SearchFormState) => {
    const [cal, tr, src] = await Promise.all([
      fetch(
        `/api/calendar?origin=${f.origin}&destination=${f.destination}&startDate=${f.departDate}`,
      ).then((r) => r.json()),
      fetch(
        `/api/trends?origin=${f.origin}&destination=${f.destination}&departDate=${f.departDate}`,
      ).then((r) => r.json()),
      fetch("/api/sources").then((r) => r.json()),
    ]);
    setCalendar(cal.days ?? []);
    setTrends(tr.points ?? []);
    setSources(src.sources ?? []);
  }, []);

  const runSearch = useCallback(
    async (next?: SearchFormState) => {
      const f = next ?? form;
      setLoading(true);
      setError(null);
      setAlertMsg(null);
      try {
        const res = await fetch(
          `/api/search?${new URLSearchParams({
            origin: f.origin,
            destination: f.destination,
            departDate: f.departDate,
            adults: String(f.adults),
            cabin: f.cabin,
            hourlyValueCny: String(f.hourlyValueCny),
            preferDirect: f.preferDirect ? "1" : "0",
          })}`,
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "搜索失败");
        setResult(json);
        await loadSide(f);
      } catch (e) {
        setError(e instanceof Error ? e.message : "搜索失败");
      } finally {
        setLoading(false);
      }
    },
    [form, loadSide],
  );

  useEffect(() => {
    void runSearch();
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) void runSearch();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [runSearch]);

  const onAlert = async (offer: SearchResponse["offers"][number]) => {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: form.origin,
        destination: form.destination,
        departDate: form.departDate,
        maxPriceCny: Math.round(offer.priceCny * 0.95),
        note: `${offer.segments.map((s) => s.flightNo).join("+")} 关注`,
      }),
    });
    if (res.ok) {
      setAlertMsg(
        `已记下提醒：${form.origin}→${form.destination} 低于 ¥${Math.round(offer.priceCny * 0.95)}`,
      );
    }
  };

  return (
    <main className="min-h-screen bg-foam text-ink-900">
      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src="/hero-sky.jpg"
          alt="飞机掠过云层"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="hero-veil absolute inset-0" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-16 pt-8 md:px-8">
          <header className="flex items-center justify-between animate-rise">
            <div className="font-display text-3xl tracking-wide text-foam md:text-4xl">
              值飞
              <span className="ml-3 align-middle text-sm font-sans tracking-[0.2em] text-skyline-300">
                ZHIFEI
              </span>
            </div>
            <div className="text-xs tracking-[0.16em] text-white/70">
              分钟级 · 多源 · 有效成本
            </div>
          </header>

          <div className="mt-auto max-w-3xl pb-10 pt-24 md:pt-0">
            <h1 className="font-display text-4xl leading-[1.15] text-foam text-balance animate-rise-delay md:text-6xl">
              买机票，先算值不值
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/78 animate-rise-late md:text-lg">
              聚合航司与中外预订平台行情，用时间成本、历史分位与行李退改，找出真正高性价比行程。
            </p>

            <div className="mt-10 animate-rise-late">
              <SearchPanel
                value={form}
                onChange={setForm}
                onSubmit={() => void runSearch()}
                loading={loading}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3 animate-rise-late">
              {popularRoutes()
                .slice(0, 5)
                .map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    className="text-sm text-white/70 underline decoration-white/25 underline-offset-4 transition hover:text-amber-300"
                    onClick={() => {
                      const next = {
                        ...form,
                        origin: r.origin,
                        destination: r.destination,
                      };
                      setForm(next);
                      void runSearch(next);
                    }}
                  >
                    {r.label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </section>

      <section id="results" className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">行程候选</h2>
            <p className="mt-2 text-sm text-ink-700/65">
              {result
                ? `${result.mode === "live" ? "含实时源" : "样本行情"} · 更新于 ${result.tickAgeSec}s 前 · ${result.offers.length} 条`
                : "正在拉取多源报价…"}
            </p>
          </div>
          {result?.mode === "sample" && (
            <p className="max-w-sm text-xs leading-relaxed text-ink-700/55">
              当前展示样本分钟级行情。配置 Amadeus 后可叠加全球 GDS
              实时报价；中国 OTA 适配层已预留。
            </p>
          )}
        </div>

        {error && (
          <p className="mb-6 text-sm text-amber-500" role="alert">
            {error}
          </p>
        )}
        {alertMsg && (
          <p className="mb-6 text-sm text-skyline-600" role="status">
            {alertMsg}
          </p>
        )}

        <div className="mb-10">
          <CalendarStrip
            days={calendar}
            selected={form.departDate}
            onSelect={(date) => {
              const next = { ...form, departDate: date };
              setForm(next);
              void runSearch(next);
            }}
          />
        </div>

        <OfferList offers={result?.offers ?? []} onAlert={onAlert} />
      </section>

      <section className="border-y border-ink-900/8 bg-white/50">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-2 md:px-8">
          <TrendChart points={trends} />
          <div>
            <h3 className="font-display text-2xl text-ink-900">信息渠道</h3>
            <p className="mt-2 mb-6 text-sm text-ink-700/65">
              统一适配层对接 GDS、中国 OTA、全球比价与航司直销，健康状态按分钟刷新。
            </p>
            <SourceRail sources={sources.length ? sources : result?.sources ?? []} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <h3 className="font-display text-3xl text-ink-900">高性价比方法论</h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-700/70">
          低价不等于划算。值飞把票价、飞行时长、中转损耗、时段质量、历史分位、行李与退改折算成「有效成本」，再给出可解释的排序。
        </p>
        <ol className="mt-10 grid gap-8 md:grid-cols-2">
          {(result?.methodNotes ?? []).map((note, i) => (
            <li key={note} className="border-t border-ink-900/10 pt-4">
              <div className="mb-2 font-display text-amber-500">0{i + 1}</div>
              <p className="text-sm leading-relaxed text-ink-800">{note}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-ink-900/8 px-5 py-8 text-center text-xs text-ink-700/45 md:px-8">
        值飞 ZhiFei · 机票高性价比搜索平台 · 样本数据仅供产品演示
      </footer>
    </main>
  );
}
