import type { FareOffer, RankedOffer, SearchQuery, ValueBreakdown } from "./types";

const AIRLINE_QUALITY: Record<string, number> = {
  CA: 0.86,
  MU: 0.84,
  CZ: 0.83,
  HU: 0.78,
  "3U": 0.76,
  SC: 0.74,
  HO: 0.8,
  "9C": 0.62,
  FM: 0.72,
  CX: 0.9,
  SQ: 0.93,
  NH: 0.88,
  JL: 0.87,
  KE: 0.86,
  TG: 0.8,
  BA: 0.84,
  AF: 0.82,
  LH: 0.85,
  KL: 0.84,
  UA: 0.8,
  AA: 0.79,
  DL: 0.81,
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function hourOf(iso: string) {
  return new Date(iso).getUTCHours();
}

function scheduleQuality(departAt: string, arriveAt: string): number {
  const dep = hourOf(departAt);
  const arr = hourOf(arriveAt);
  let score = 70;
  if (dep >= 8 && dep <= 11) score += 15;
  else if (dep >= 13 && dep <= 18) score += 10;
  else if (dep < 6 || dep >= 23) score -= 20;
  else if (dep >= 21) score -= 10;

  if (arr >= 8 && arr <= 21) score += 10;
  else if (arr < 6 || arr >= 23) score -= 15;
  return clamp(score);
}

function baseRoutePrice(durationMin: number, stops: number): number {
  const hours = Math.max(1, durationMin / 60);
  // 更贴近国内/短途与长航线的票价量级，避免价格分被系统性打到 0
  return 360 + hours * 320 + stops * 220;
}

function expectedDurationFloor(durationMin: number, stops: number): number {
  if (stops === 0) return Math.max(75, durationMin * 0.92);
  return Math.max(120, durationMin * 0.55);
}

/** 高性价比核心：有效成本 = 票价 + 时间成本 + 不便成本 − 行李/灵活性溢价 */
export function scoreOffer(
  offer: FareOffer,
  query: SearchQuery,
  historyPrices: number[],
): ValueBreakdown {
  const hourly = query.hourlyValueCny ?? 80;
  const timeCost = (offer.durationMin / 60) * hourly;
  const stopPenalty = offer.stops * hourly * 1.4;
  const schedule =
    offer.segments[0] && offer.segments[offer.segments.length - 1]
      ? scheduleQuality(
          offer.segments[0].departAt,
          offer.segments[offer.segments.length - 1].arriveAt,
        )
      : 70;
  const schedulePenalty = ((100 - schedule) / 100) * hourly * 2;

  const baggageBonus = offer.baggageKg >= 20 ? 60 : offer.baggageKg >= 7 ? 20 : 0;
  const flexBonus =
    (offer.refundable ? 80 : 0) + (offer.changeable ? 40 : 0);

  const effectiveCostCny =
    offer.priceCny +
    timeCost +
    stopPenalty +
    schedulePenalty -
    baggageBonus -
    flexBonus * 0.15;

  const expected = baseRoutePrice(offer.durationMin, offer.stops);
  const vsExpected = offer.priceCny / Math.max(1, expected);
  let priceScore = clamp(108 - (vsExpected - 0.75) * 85);

  if (historyPrices.length >= 3) {
    const median = [...historyPrices].sort((a, b) => a - b)[
      Math.floor(historyPrices.length / 2)
    ];
    const vsHist = offer.priceCny / Math.max(1, median);
    priceScore = clamp(priceScore * 0.45 + clamp(115 - vsHist * 90) * 0.55);
  }

  const idealDuration = Math.max(90, expectedDurationFloor(offer.durationMin, offer.stops));
  const timeScore = clamp(
    100 - ((offer.durationMin - idealDuration) / idealDuration) * 45,
  );

  const airlineCode = offer.segments[0]?.airline ?? "";
  const airlineQ = (AIRLINE_QUALITY[airlineCode] ?? 0.7) * 100;
  const convenienceScore = clamp(
    schedule * 0.45 +
      airlineQ * 0.35 +
      (offer.stops === 0 ? 25 : offer.stops === 1 ? 10 : 0),
  );

  let historyScore = 55;
  if (historyPrices.length >= 3) {
    const sorted = [...historyPrices].sort((a, b) => a - b);
    const cheaper = sorted.filter((p) => p < offer.priceCny).length;
    const pct = cheaper / sorted.length;
    historyScore = clamp(100 - pct * 100);
  }

  const baggageScore = clamp(offer.baggageKg * 4 + (offer.baggageKg >= 20 ? 20 : 0));
  const flexibilityScore = clamp(
    (offer.refundable ? 55 : 10) + (offer.changeable ? 35 : 5),
  );

  const preferDirectBoost = query.preferDirect && offer.stops === 0 ? 6 : 0;

  const total = clamp(
    priceScore * 0.34 +
      timeScore * 0.18 +
      convenienceScore * 0.18 +
      historyScore * 0.16 +
      baggageScore * 0.07 +
      flexibilityScore * 0.07 +
      preferDirectBoost,
  );

  const reasons: string[] = [];
  if (priceScore >= 78) reasons.push("票价显著低于同航线基准");
  if (offer.stops === 0) reasons.push("直飞节省中转时间成本");
  if (historyScore >= 75) reasons.push("处于近窗历史低位分位");
  if (offer.baggageKg >= 20) reasons.push("含托运行李，隐性成本更低");
  if (schedule >= 80) reasons.push("出发/到达时段友好");
  if (flexibilityScore >= 70) reasons.push("退改规则更友好");
  if (reasons.length === 0) reasons.push("综合时间、价格与体验权衡后的均衡选择");

  return {
    priceScore: Math.round(priceScore),
    timeScore: Math.round(timeScore),
    convenienceScore: Math.round(convenienceScore),
    historyScore: Math.round(historyScore),
    baggageScore: Math.round(baggageScore),
    flexibilityScore: Math.round(flexibilityScore),
    total: Math.round(total * 10) / 10,
    effectiveCostCny: Math.round(effectiveCostCny),
    reasons,
  };
}

export function rankOffers(
  offers: FareOffer[],
  query: SearchQuery,
  historyByOffer: Map<string, number[]>,
): RankedOffer[] {
  const ranked = offers.map((offer) => {
    const history = historyByOffer.get(offer.id) ?? historyByOffer.get("route") ?? [];
    const value = scoreOffer(offer, query, history);
    const sorted = [...history].sort((a, b) => a - b);
    const cheaper = sorted.filter((p) => p < offer.priceCny).length;
    const priceVsHistoryPct =
      sorted.length === 0 ? 50 : Math.round((cheaper / sorted.length) * 100);

    const badges: string[] = [];
    if (value.total >= 82) badges.push("高性价比");
    if (offer.stops === 0) badges.push("直飞");
    if (priceVsHistoryPct <= 25) badges.push("历史低位");
    if (offer.baggageKg >= 20) badges.push("含托运");
    if (offer.source === "airline_direct") badges.push("航司直销");

    const sparkline =
      history.length > 0
        ? history.slice(-12)
        : Array.from({ length: 12 }, (_, i) =>
            Math.round(offer.priceCny * (1 + Math.sin(i / 2) * 0.04)),
          );

    return {
      ...offer,
      value,
      rank: 0,
      badges,
      priceVsHistoryPct,
      sparkline,
    };
  });

  ranked.sort((a, b) => {
    if (b.value.total !== a.value.total) return b.value.total - a.value.total;
    return a.priceCny - b.priceCny;
  });

  return ranked.map((o, i) => ({ ...o, rank: i + 1 }));
}

export const METHOD_NOTES = [
  "性价比 ≠ 最低价：有效成本 = 票价 + 飞行/中转时间成本 + 时段不便成本 − 行李与退改价值。",
  "分钟级比价：聚合多源报价后按观测时间对齐，优先展示最新可用价与历史分位。",
  "临近机场：同城多机场与跨境口岸常可再砍一刀，但需计入地面交通成本。",
  "灵活日期：±1~3 天往往比锁死单日更优；周末与节假日溢价显著。",
  "直飞溢价要算账：若时薪较高，贵一点的直飞经常更「值」。",
];
