export type CabinClass = "economy" | "premium" | "business";

export type FareSourceId =
  | "amadeus"
  | "ctrip"
  | "qunar"
  | "fliggy"
  | "skyscanner"
  | "airline_direct";

export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
  region: "CN" | "ASIA" | "EU" | "NA" | "OTHER";
  nearby?: string[];
}

export interface SearchQuery {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
  cabin?: CabinClass;
  flexibleDays?: number;
  hourlyValueCny?: number;
  preferDirect?: boolean;
  includeNearby?: boolean;
}

export interface FlightSegment {
  airline: string;
  airlineName: string;
  flightNo: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveAt: string;
  durationMin: number;
}

export interface FareOffer {
  id: string;
  source: FareSourceId;
  sourceLabel: string;
  priceCny: number;
  currency: string;
  cabin: CabinClass;
  stops: number;
  durationMin: number;
  segments: FlightSegment[];
  baggageKg: number;
  refundable: boolean;
  changeable: boolean;
  observedAt: string;
  rawAirline?: string;
}

export interface ValueBreakdown {
  priceScore: number;
  timeScore: number;
  convenienceScore: number;
  historyScore: number;
  baggageScore: number;
  flexibilityScore: number;
  total: number;
  effectiveCostCny: number;
  reasons: string[];
}

export interface RankedOffer extends FareOffer {
  value: ValueBreakdown;
  rank: number;
  badges: string[];
  priceVsHistoryPct: number;
  sparkline: number[];
}

export interface CalendarDayFare {
  date: string;
  minPriceCny: number;
  bestValueScore: number;
  directAvailable: boolean;
}

export interface PriceTrendPoint {
  t: string;
  priceCny: number;
  source: string;
}

export interface SourceStatus {
  id: FareSourceId;
  label: string;
  region: string;
  status: "live" | "demo" | "degraded" | "offline";
  latencyMs: number;
  lastOkAt: string;
  detail: string;
}

export interface SearchResponse {
  query: SearchQuery;
  mode: "live" | "sample";
  generatedAt: string;
  tickAgeSec: number;
  sources: SourceStatus[];
  offers: RankedOffer[];
  nearbyTips: Array<{
    origin: string;
    destination: string;
    saveCny: number;
    note: string;
  }>;
  methodNotes: string[];
}
