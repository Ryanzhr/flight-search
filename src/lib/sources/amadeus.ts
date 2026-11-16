import type { FareOffer, SearchQuery, SourceStatus } from "../types";

type TokenCache = { accessToken: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

function credentials() {
  const clientId = process.env.AMADEUS_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET?.trim() ?? "";
  return { clientId, clientSecret, ready: Boolean(clientId && clientSecret) };
}

async function getToken(): Promise<string | null> {
  const { clientId, clientSecret, ready } = credentials();
  if (!ready) return null;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return tokenCache.accessToken;
}

function cabinMap(cabin: SearchQuery["cabin"]) {
  if (cabin === "business") return "BUSINESS";
  if (cabin === "premium") return "PREMIUM_ECONOMY";
  return "ECONOMY";
}

export async function amadeusStatus(): Promise<SourceStatus> {
  const { ready } = credentials();
  if (!ready) {
    return {
      id: "amadeus",
      label: "Amadeus",
      region: "全球 GDS",
      status: "offline",
      latencyMs: 0,
      lastOkAt: new Date(0).toISOString(),
      detail: "未配置凭证，使用样本行情",
    };
  }

  const started = Date.now();
  const token = await getToken();
  if (!token) {
    return {
      id: "amadeus",
      label: "Amadeus",
      region: "全球 GDS",
      status: "degraded",
      latencyMs: Date.now() - started,
      lastOkAt: new Date(0).toISOString(),
      detail: "鉴权失败",
    };
  }

  return {
    id: "amadeus",
    label: "Amadeus",
    region: "全球 GDS",
    status: "live",
    latencyMs: Date.now() - started,
    lastOkAt: new Date().toISOString(),
    detail: "test.api.amadeus.com 已连通",
  };
}

export async function searchAmadeus(query: SearchQuery): Promise<FareOffer[]> {
  const token = await getToken();
  if (!token) return [];

  const params = new URLSearchParams({
    originLocationCode: query.origin.toUpperCase(),
    destinationLocationCode: query.destination.toUpperCase(),
    departureDate: query.departDate,
    adults: String(query.adults ?? 1),
    currencyCode: "CNY",
    max: "20",
    travelClass: cabinMap(query.cabin),
  });
  if (query.returnDate) params.set("returnDate", query.returnDate);

  const res = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];

  const json = (await res.json()) as {
    data?: Array<{
      id: string;
      price?: { total?: string; currency?: string };
      itineraries?: Array<{
        duration?: string;
        segments?: Array<{
          carrierCode?: string;
          number?: string;
          departure?: { iataCode?: string; at?: string };
          arrival?: { iataCode?: string; at?: string };
          duration?: string;
        }>;
      }>;
      travelerPricings?: Array<{
        fareDetailsBySegment?: Array<{
          includedCheckedBags?: { weight?: number; quantity?: number };
        }>;
      }>;
    }>;
    dictionaries?: { carriers?: Record<string, string> };
  };

  const carriers = json.dictionaries?.carriers ?? {};
  const now = new Date().toISOString();

  return (json.data ?? []).flatMap((item) => {
    const itinerary = item.itineraries?.[0];
    const segmentsRaw = itinerary?.segments ?? [];
    if (segmentsRaw.length === 0) return [];

    const segments = segmentsRaw.map((s) => ({
      airline: s.carrierCode ?? "XX",
      airlineName: carriers[s.carrierCode ?? ""] ?? s.carrierCode ?? "Unknown",
      flightNo: `${s.carrierCode ?? "XX"}${s.number ?? ""}`,
      origin: s.departure?.iataCode ?? query.origin,
      destination: s.arrival?.iataCode ?? query.destination,
      departAt: s.departure?.at ?? now,
      arriveAt: s.arrival?.at ?? now,
      durationMin: parseIsoDuration(s.duration),
    }));

    const bags =
      item.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags;
    const baggageKg = bags?.weight ?? (bags?.quantity ? bags.quantity * 23 : 0);

    return [
      {
        id: `amadeus-${item.id}`,
        source: "amadeus" as const,
        sourceLabel: "Amadeus",
        priceCny: Math.round(Number(item.price?.total ?? 0)),
        currency: item.price?.currency ?? "CNY",
        cabin: query.cabin ?? "economy",
        stops: Math.max(0, segments.length - 1),
        durationMin: parseIsoDuration(itinerary?.duration),
        segments,
        baggageKg,
        refundable: false,
        changeable: false,
        observedAt: now,
      },
    ];
  });
}

function parseIsoDuration(iso?: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

export function amadeusConfigured() {
  return credentials().ready;
}
