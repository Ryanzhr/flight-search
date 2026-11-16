import { getAirport } from "../airports";
import type {
  CabinClass,
  FareOffer,
  FareSourceId,
  SearchQuery,
  SourceStatus,
} from "../types";

const AIRLINES: Array<{ code: string; name: string; regionBias: string[] }> = [
  { code: "CA", name: "中国国际航空", regionBias: ["CN", "EU", "NA"] },
  { code: "MU", name: "中国东方航空", regionBias: ["CN", "ASIA", "EU"] },
  { code: "CZ", name: "中国南方航空", regionBias: ["CN", "ASIA", "OTHER"] },
  { code: "HU", name: "海南航空", regionBias: ["CN", "EU", "NA"] },
  { code: "3U", name: "四川航空", regionBias: ["CN", "ASIA"] },
  { code: "HO", name: "吉祥航空", regionBias: ["CN", "ASIA"] },
  { code: "9C", name: "春秋航空", regionBias: ["CN", "ASIA"] },
  { code: "CX", name: "国泰航空", regionBias: ["ASIA", "EU", "NA"] },
  { code: "SQ", name: "新加坡航空", regionBias: ["ASIA", "EU", "OTHER"] },
  { code: "NH", name: "全日空", regionBias: ["ASIA", "NA"] },
  { code: "JL", name: "日本航空", regionBias: ["ASIA", "NA"] },
  { code: "KE", name: "大韩航空", regionBias: ["ASIA", "NA", "EU"] },
  { code: "TG", name: "泰国国际航空", regionBias: ["ASIA"] },
  { code: "BA", name: "英国航空", regionBias: ["EU", "NA"] },
  { code: "AF", name: "法国航空", regionBias: ["EU", "ASIA"] },
  { code: "LH", name: "汉莎航空", regionBias: ["EU", "ASIA"] },
  { code: "UA", name: "美联航", regionBias: ["NA", "ASIA"] },
];

const OTA_META: Array<{
  id: FareSourceId;
  label: string;
  region: string;
  markup: number;
  volatility: number;
}> = [
  { id: "ctrip", label: "携程", region: "中国 OTA", markup: 1.0, volatility: 0.018 },
  { id: "qunar", label: "去哪儿", region: "中国 OTA", markup: 0.985, volatility: 0.022 },
  { id: "fliggy", label: "飞猪", region: "中国 OTA", markup: 0.992, volatility: 0.02 },
  {
    id: "skyscanner",
    label: "Skyscanner",
    region: "全球比价",
    markup: 1.01,
    volatility: 0.015,
  },
  {
    id: "airline_direct",
    label: "航司官网",
    region: "直销",
    markup: 1.03,
    volatility: 0.01,
  },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(n: number) {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function distanceBias(origin: string, destination: string): number {
  const o = getAirport(origin);
  const d = getAirport(destination);
  if (!o || !d) return 1.2;
  if (o.country === "CN" && d.country === "CN") return 0.55;
  if (o.region === d.region) return 0.85;
  if (
    (o.region === "CN" || o.region === "ASIA") &&
    (d.region === "CN" || d.region === "ASIA")
  )
    return 0.95;
  if (d.region === "EU" || o.region === "EU") return 1.55;
  if (d.region === "NA" || o.region === "NA") return 1.85;
  return 1.35;
}

function minuteBucket(date = new Date()) {
  return Math.floor(date.getTime() / 60_000);
}

function cabinMult(cabin: CabinClass) {
  if (cabin === "business") return 3.4;
  if (cabin === "premium") return 1.65;
  return 1;
}

export function getSimulatedSourceStatus(now = new Date()): SourceStatus[] {
  const bucket = minuteBucket(now);
  return OTA_META.map((ota, i) => {
    const wave = seeded(bucket + i * 17);
    const status: SourceStatus["status"] =
      wave > 0.94 ? "degraded" : "demo";
    return {
      id: ota.id,
      label: ota.label,
      region: ota.region,
      status,
      latencyMs: Math.round(80 + seeded(bucket + i * 3) * 220),
      lastOkAt: new Date(now.getTime() - Math.round(wave * 40_000)).toISOString(),
      detail:
        status === "degraded"
          ? "渠道瞬时限流，已回退缓存报价"
          : "分钟级模拟行情（可切换真实 API）",
    };
  });
}

export function simulateOffers(query: SearchQuery, now = new Date()): FareOffer[] {
  const origin = query.origin.toUpperCase();
  const destination = query.destination.toUpperCase();
  const cabin = query.cabin ?? "economy";
  const adults = query.adults ?? 1;
  const bucket = minuteBucket(now);
  const routeSeed = hash(`${origin}-${destination}-${query.departDate}`);
  const dist = distanceBias(origin, destination);
  const base =
    (420 + (routeSeed % 380) + dist * 1180) * cabinMult(cabin) * adults;

  const o = getAirport(origin);
  const d = getAirport(destination);
  const isDomestic = o?.country === "CN" && d?.country === "CN";
  const offers: FareOffer[] = [];

  const airlinePool = AIRLINES.filter((a) => {
    if (!o || !d) return true;
    return a.regionBias.includes(o.region) || a.regionBias.includes(d.region);
  });

  const variants = 5 + (routeSeed % 3);
  for (let i = 0; i < variants; i++) {
    const airline = airlinePool[(routeSeed + i * 5) % airlinePool.length];
    const stops = isDomestic
      ? seeded(routeSeed + i) > 0.78
        ? 1
        : 0
      : seeded(routeSeed + i * 9) > 0.55
        ? seeded(routeSeed + i) > 0.7
          ? 2
          : 1
        : 0;

    const blockHours =
      (isDomestic ? 2.1 : 4.5) * dist + stops * 2.2 + seeded(routeSeed + i * 2) * 1.4;
    const durationMin = Math.round(blockHours * 60);
    const depHour = Math.floor(6 + seeded(routeSeed + i * 11) * 16);
    const depMin = [0, 15, 30, 45][Math.floor(seeded(routeSeed + i * 13) * 4)];
    const departAt = new Date(`${query.departDate}T${String(depHour).padStart(2, "0")}:${String(depMin).padStart(2, "0")}:00+08:00`);
    const arriveAt = new Date(departAt.getTime() + durationMin * 60_000);

    const stopPenalty = 1 + stops * 0.12 - (stops === 0 ? 0.08 : 0);
    const schedulePremium =
      depHour >= 8 && depHour <= 10 ? 1.08 : depHour < 7 || depHour >= 22 ? 0.9 : 1;

    for (const ota of OTA_META) {
      if (ota.id === "airline_direct" && seeded(routeSeed + i + 99) < 0.45) continue;
      const minuteNoise =
        1 +
        (seeded(bucket * 31 + hash(ota.id) + i) - 0.5) * 2 * ota.volatility;
      const dayWave = 1 + Math.sin((bucket / 60 + i) / 3) * 0.03;
      const price = Math.round(
        base * stopPenalty * schedulePremium * ota.markup * minuteNoise * dayWave,
      );

      const flightNo = `${airline.code}${100 + ((routeSeed + i) % 800)}`;
      const segments =
        stops === 0
          ? [
              {
                airline: airline.code,
                airlineName: airline.name,
                flightNo,
                origin,
                destination,
                departAt: departAt.toISOString(),
                arriveAt: arriveAt.toISOString(),
                durationMin,
              },
            ]
          : buildViaSegments({
              airline,
              origin,
              destination,
              departAt,
              durationMin,
              stops,
              flightNo,
              seed: routeSeed + i,
            });

      const lowCost = airline.code === "9C";
      offers.push({
        id: `${ota.id}-${flightNo}-${query.departDate}-${i}`,
        source: ota.id,
        sourceLabel: ota.label,
        priceCny: price,
        currency: "CNY",
        cabin,
        stops,
        durationMin,
        segments,
        baggageKg: lowCost ? (seeded(routeSeed + i + 3) > 0.5 ? 0 : 7) : 20 + (i % 2) * 3,
        refundable: !lowCost && seeded(routeSeed + i + 7) > 0.55,
        changeable: !lowCost && seeded(routeSeed + i + 8) > 0.35,
        observedAt: new Date(
          now.getTime() - Math.floor(seeded(bucket + i) * 50_000),
        ).toISOString(),
        rawAirline: airline.code,
      });
    }
  }

  return offers;
}

function buildViaSegments(opts: {
  airline: { code: string; name: string };
  origin: string;
  destination: string;
  departAt: Date;
  durationMin: number;
  stops: number;
  flightNo: string;
  seed: number;
}) {
  const hubs = ["HKG", "ICN", "BKK", "SIN", "DXB", "PVG", "CAN", "AMS"];
  const via = hubs[(opts.seed * 7) % hubs.length];
  const firstLeg = Math.round(opts.durationMin * (0.35 + seeded(opts.seed) * 0.2));
  const mid = new Date(opts.departAt.getTime() + firstLeg * 60_000);
  const layover = 60 + Math.floor(seeded(opts.seed + 1) * 120);
  const secondStart = new Date(mid.getTime() + layover * 60_000);
  const arrive = new Date(opts.departAt.getTime() + opts.durationMin * 60_000);

  return [
    {
      airline: opts.airline.code,
      airlineName: opts.airline.name,
      flightNo: opts.flightNo,
      origin: opts.origin,
      destination: via,
      departAt: opts.departAt.toISOString(),
      arriveAt: mid.toISOString(),
      durationMin: firstLeg,
    },
    {
      airline: opts.airline.code,
      airlineName: opts.airline.name,
      flightNo: `${opts.airline.code}${200 + (opts.seed % 700)}`,
      origin: via,
      destination: opts.destination,
      departAt: secondStart.toISOString(),
      arriveAt: arrive.toISOString(),
      durationMin: Math.max(60, opts.durationMin - firstLeg - layover),
    },
  ];
}

export function simulateHistory(
  query: SearchQuery,
  points = 48,
  now = new Date(),
): number[] {
  const offers = simulateOffers(query, now);
  const base = Math.min(...offers.map((o) => o.priceCny));
  const seed = hash(`${query.origin}-${query.destination}-${query.departDate}`);
  return Array.from({ length: points }, (_, i) => {
    const t = points - i;
    const wave = Math.sin((seed + i) / 5) * 0.06 + Math.cos(i / 3) * 0.03;
    const trend = 1 + (t / points) * 0.04;
    return Math.round(base * (1 + wave) * trend);
  });
}

export function simulateCalendar(
  origin: string,
  destination: string,
  startDate: string,
  days = 21,
): Array<{
  date: string;
  minPriceCny: number;
  bestValueScore: number;
  directAvailable: boolean;
}> {
  const start = new Date(`${startDate}T00:00:00+08:00`);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * 86400_000);
    const date = d.toISOString().slice(0, 10);
    const offers = simulateOffers({
      origin,
      destination,
      departDate: date,
    });
    const minPriceCny = Math.min(...offers.map((o) => o.priceCny));
    const directAvailable = offers.some((o) => o.stops === 0);
    const weekend = d.getUTCDay() === 5 || d.getUTCDay() === 6;
    const bestValueScore = Math.round(
      88 - (weekend ? 12 : 0) - (i % 5) * 1.5 + (directAvailable ? 4 : 0),
    );
    return { date, minPriceCny, bestValueScore, directAvailable };
  });
}
