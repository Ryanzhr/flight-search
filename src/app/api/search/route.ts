import { NextRequest, NextResponse } from "next/server";
import { getAirport } from "@/lib/airports";
import { searchFlights } from "@/lib/sources";
import type { CabinClass, SearchQuery } from "@/lib/types";

export const dynamic = "force-dynamic";

function defaultDate(offsetDays = 14) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const origin = (sp.get("origin") || "PEK").toUpperCase();
  const destination = (sp.get("destination") || "SHA").toUpperCase();
  const departDate = sp.get("departDate") || defaultDate();

  if (!getAirport(origin) || !getAirport(destination)) {
    return NextResponse.json(
      { error: "不支持的机场代码，请从列表选择" },
      { status: 400 },
    );
  }
  if (origin === destination) {
    return NextResponse.json({ error: "出发地与目的地不能相同" }, { status: 400 });
  }

  const query: SearchQuery = {
    origin,
    destination,
    departDate,
    returnDate: sp.get("returnDate") || undefined,
    adults: Number(sp.get("adults") || 1),
    cabin: (sp.get("cabin") as CabinClass) || "economy",
    flexibleDays: Number(sp.get("flexibleDays") || 0),
    hourlyValueCny: Number(sp.get("hourlyValueCny") || 80),
    preferDirect: sp.get("preferDirect") === "1",
    includeNearby: sp.get("includeNearby") !== "0",
  };

  const result = await searchFlights(query);
  return NextResponse.json(result);
}
