import assert from "node:assert/strict";
import { test } from "node:test";
import { rankOffers, scoreOffer } from "./scoring";
import type { FareOffer, SearchQuery } from "./types";

const query: SearchQuery = {
  origin: "PEK",
  destination: "SHA",
  departDate: "2026-12-01",
  hourlyValueCny: 100,
  preferDirect: true,
};

function offer(partial: Partial<FareOffer> & Pick<FareOffer, "id" | "priceCny" | "stops" | "durationMin">): FareOffer {
  return {
    source: "ctrip",
    sourceLabel: "携程",
    currency: "CNY",
    cabin: "economy",
    baggageKg: 20,
    refundable: true,
    changeable: true,
    observedAt: new Date().toISOString(),
    segments: [
      {
        airline: "CA",
        airlineName: "中国国际航空",
        flightNo: "CA1501",
        origin: "PEK",
        destination: "SHA",
        departAt: "2026-12-01T09:00:00+08:00",
        arriveAt: "2026-12-01T11:20:00+08:00",
        durationMin: partial.durationMin,
      },
    ],
    ...partial,
  };
}

test("direct cheap flight scores higher than long connection", () => {
  const direct = scoreOffer(
    offer({ id: "a", priceCny: 900, stops: 0, durationMin: 140 }),
    query,
    [1000, 1100, 950, 1200],
  );
  const connection = scoreOffer(
    offer({
      id: "b",
      priceCny: 780,
      stops: 1,
      durationMin: 360,
      baggageKg: 0,
      refundable: false,
      changeable: false,
    }),
    query,
    [1000, 1100, 950, 1200],
  );
  assert.ok(direct.total > connection.total);
  assert.ok(direct.effectiveCostCny < connection.effectiveCostCny);
});

test("rankOffers puts higher value first when prices are close", () => {
  const ranked = rankOffers(
    [
      offer({
        id: "cheap-slow",
        priceCny: 940,
        stops: 2,
        durationMin: 520,
        baggageKg: 0,
        refundable: false,
        changeable: false,
      }),
      offer({ id: "value", priceCny: 960, stops: 0, durationMin: 140 }),
    ],
    { ...query, hourlyValueCny: 160, preferDirect: true },
    new Map([["route", [900, 950, 1000, 1100]]]),
  );
  assert.equal(ranked[0].id, "value");
  assert.equal(ranked[0].rank, 1);
  assert.ok(ranked[0].value.effectiveCostCny < ranked[1].value.effectiveCostCny);
});
