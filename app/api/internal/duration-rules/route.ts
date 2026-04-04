import { NextResponse } from "next/server";
import { listInternalDurationRules } from "@/src/server/staff-setup";

export async function GET() {
  const payload = await listInternalDurationRules();
  return NextResponse.json(payload);
}
