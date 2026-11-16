import { NextRequest, NextResponse } from "next/server";
import { getAirport } from "@/lib/airports";
import { getCalendar } from "@/lib/sources";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const origin = (sp.get("origin") || "PEK").toUpperCase();
  const destination = (sp.get("destination") || "SHA").toUpperCase();
  const startDate =
    sp.get("startDate") || new Date().toISOString().slice(0, 10);

  if (!getAirport(origin) || !getAirport(destination)) {
    return NextResponse.json({ error: "无效机场" }, { status: 400 });
  }

  const days = await getCalendar(origin, destination, startDate);
  return NextResponse.json({ origin, destination, days });
}
