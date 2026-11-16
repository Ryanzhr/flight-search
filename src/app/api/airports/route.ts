import { NextResponse } from "next/server";
import { AIRPORTS } from "@/lib/airports";

export async function GET() {
  return NextResponse.json({ airports: AIRPORTS });
}
