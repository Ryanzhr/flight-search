import { NextRequest, NextResponse } from "next/server";
import { getTrends } from "@/lib/sources";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const origin = (sp.get("origin") || "PEK").toUpperCase();
  const destination = (sp.get("destination") || "SHA").toUpperCase();
  const departDate =
    sp.get("departDate") ||
    new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);

  const points = await getTrends(origin, destination, departDate);
  return NextResponse.json({ origin, destination, departDate, points });
}
