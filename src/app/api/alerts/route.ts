import { NextRequest, NextResponse } from "next/server";
import { createAlert, listAlerts } from "@/lib/sources";

export const dynamic = "force-dynamic";

export async function GET() {
  const alerts = await listAlerts();
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    origin?: string;
    destination?: string;
    departDate?: string;
    maxPriceCny?: number;
    note?: string;
  };

  if (!body.origin || !body.destination || !body.maxPriceCny) {
    return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
  }

  const row = await createAlert({
    origin: body.origin,
    destination: body.destination,
    departDate: body.departDate,
    maxPriceCny: Number(body.maxPriceCny),
    note: body.note,
  });

  return NextResponse.json({ ok: true, alert: row });
}
