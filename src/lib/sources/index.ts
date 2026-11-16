import { getAirport, routeKey } from "../airports";
import { sql } from "../db";
import { METHOD_NOTES, rankOffers } from "../scoring";
import type {
  CalendarDayFare,
  FareOffer,
  PriceTrendPoint,
  SearchQuery,
  SearchResponse,
  SourceStatus,
} from "../types";
import { amadeusConfigured, amadeusStatus, searchAmadeus } from "./amadeus";
import {
  getSimulatedSourceStatus,
  simulateCalendar,
  simulateHistory,
  simulateOffers,
} from "./simulated";

function uniqueByFlight(offers: FareOffer[]): FareOffer[] {
  const byFlight = new Map<string, FareOffer[]>();
  for (const offer of offers) {
    const flightKey = offer.segments.map((s) => s.flightNo).join("+");
    const list = byFlight.get(flightKey) ?? [];
    list.push(offer);
    byFlight.set(flightKey, list);
  }
  const result: FareOffer[] = [];
  for (const list of byFlight.values()) {
    list.sort((a, b) => a.priceCny - b.priceCny);
    result.push(...list.slice(0, 2));
  }
  return result;
}

async function persistTicks(query: SearchQuery, offers: FareOffer[]) {
  const key = routeKey(query.origin, query.destination, query.departDate);
  for (const offer of offers.slice(0, 40)) {
    await sql(
      `insert into price_ticks
      (route_key, origin, destination, depart_date, source, airline, flight_no, price_cny, currency, stops, duration_min, value_score, observed_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        key,
        query.origin.toUpperCase(),
        query.destination.toUpperCase(),
        query.departDate,
        offer.source,
        offer.segments[0]?.airline ?? "",
        offer.segments.map((s) => s.flightNo).join("+"),
        offer.priceCny,
        offer.currency,
        offer.stops,
        offer.durationMin,
        null,
        offer.observedAt,
      ],
    );
  }
}

async function loadHistory(query: SearchQuery): Promise<number[]> {
  const key = routeKey(query.origin, query.destination, query.departDate);
  const rows = await sql<{ price_cny: string }>(
    `select price_cny from price_ticks
     where route_key = $1
     order by observed_at asc
     limit 120`,
    [key],
  );
  if (rows.length >= 6) return rows.map((r) => Number(r.price_cny));
  return simulateHistory(query);
}

async function upsertSourceHealth(sources: SourceStatus[]) {
  for (const s of sources) {
    await sql(
      `insert into source_health (source, label, region, status, latency_ms, last_ok_at, detail)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (source) do update set
         label = excluded.label,
         region = excluded.region,
         status = excluded.status,
         latency_ms = excluded.latency_ms,
         last_ok_at = excluded.last_ok_at,
         detail = excluded.detail`,
      [s.id, s.label, s.region, s.status, s.latencyMs, s.lastOkAt, s.detail],
    );
  }
}

function buildNearbyTips(query: SearchQuery, basePrice: number) {
  const tips: SearchResponse["nearbyTips"] = [];
  const o = getAirport(query.origin);
  const d = getAirport(query.destination);
  for (const near of o?.nearby ?? []) {
    const alt = simulateOffers({ ...query, origin: near });
    const min = Math.min(...alt.map((x) => x.priceCny));
    const save = Math.round(basePrice - min);
    if (save > 80) {
      tips.push({
        origin: near,
        destination: query.destination.toUpperCase(),
        saveCny: save,
        note: `改从 ${near} 出发，样本价可再省约 ¥${save}（需计入城际交通）`,
      });
    }
  }
  for (const near of d?.nearby ?? []) {
    const alt = simulateOffers({ ...query, destination: near });
    const min = Math.min(...alt.map((x) => x.priceCny));
    const save = Math.round(basePrice - min);
    if (save > 80) {
      tips.push({
        origin: query.origin.toUpperCase(),
        destination: near,
        saveCny: save,
        note: `改飞 ${near}，样本价可再省约 ¥${save}（需计入到达段交通）`,
      });
    }
  }
  return tips.slice(0, 4);
}

export async function searchFlights(query: SearchQuery): Promise<SearchResponse> {
  const now = new Date();
  const simStatus = getSimulatedSourceStatus(now);
  const amdStatus = await amadeusStatus();
  const sources = [amdStatus, ...simStatus];

  let liveOffers: FareOffer[] = [];
  if (amadeusConfigured()) {
    try {
      liveOffers = await searchAmadeus(query);
    } catch {
      amdStatus.status = "degraded";
      amdStatus.detail = "查询失败，已回退样本行情";
    }
  }

  const sampleOffers = simulateOffers(query, now);
  const offers = uniqueByFlight([...liveOffers, ...sampleOffers]);
  const history = await loadHistory(query);
  const historyByOffer = new Map<string, number[]>();
  historyByOffer.set("route", history);
  for (const offer of offers) {
    historyByOffer.set(
      offer.id,
      history.map((p, i) =>
        Math.round(p * (0.96 + ((i + offer.priceCny) % 7) * 0.01)),
      ),
    );
  }

  const ranked = rankOffers(offers, query, historyByOffer).slice(0, 30);

  try {
    await persistTicks(query, offers);
    await upsertSourceHealth(sources);
  } catch {
    // local persistence is best-effort
  }

  const nearbyTips = buildNearbyTips(query, ranked[0]?.priceCny ?? 0);
  const newest = Math.max(
    ...ranked.map((o) => new Date(o.observedAt).getTime()),
    now.getTime() - 60_000,
  );
  const tickAgeSec = Math.max(0, Math.round((Date.now() - newest) / 1000));

  return {
    query,
    mode: liveOffers.length > 0 ? "live" : "sample",
    generatedAt: now.toISOString(),
    tickAgeSec,
    sources,
    offers: ranked,
    nearbyTips,
    methodNotes: METHOD_NOTES,
  };
}

export async function getCalendar(
  origin: string,
  destination: string,
  startDate: string,
): Promise<CalendarDayFare[]> {
  return simulateCalendar(origin, destination, startDate, 28);
}

export async function getTrends(
  origin: string,
  destination: string,
  departDate: string,
): Promise<PriceTrendPoint[]> {
  const key = routeKey(origin, destination, departDate);
  const rows = await sql<{
    observed_at: string;
    price_cny: string;
    source: string;
  }>(
    `select observed_at, price_cny, source from price_ticks
     where route_key = $1
     order by observed_at desc
     limit 60`,
    [key],
  );

  if (rows.length >= 8) {
    return rows.reverse().map((r) => ({
      t: r.observed_at,
      priceCny: Number(r.price_cny),
      source: r.source,
    }));
  }

  const history = simulateHistory({ origin, destination, departDate });
  const now = Date.now();
  return history.map((priceCny, i) => ({
    t: new Date(now - (history.length - i) * 60_000).toISOString(),
    priceCny,
    source: "aggregate",
  }));
}

export async function listSources(): Promise<SourceStatus[]> {
  const amd = await amadeusStatus();
  return [amd, ...getSimulatedSourceStatus()];
}

export async function createAlert(input: {
  origin: string;
  destination: string;
  departDate?: string;
  maxPriceCny: number;
  note?: string;
}) {
  const rows = await sql<{ id: string }>(
    `insert into price_alerts (origin, destination, depart_date, max_price_cny, note)
     values ($1,$2,$3,$4,$5) returning id`,
    [
      input.origin.toUpperCase(),
      input.destination.toUpperCase(),
      input.departDate || null,
      input.maxPriceCny,
      input.note ?? null,
    ],
  );
  return rows[0];
}

export async function listAlerts() {
  return sql<{
    id: string;
    origin: string;
    destination: string;
    depart_date: string | null;
    max_price_cny: string;
    note: string | null;
    active: boolean;
    created_at: string;
  }>(
    `select id, origin, destination, depart_date, max_price_cny, note, active, created_at
     from price_alerts where active = true order by created_at desc limit 50`,
  );
}
