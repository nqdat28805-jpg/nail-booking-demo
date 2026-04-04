import { NextResponse } from "next/server";
import { createInternalBlockOff, listInternalBlockOffs } from "@/src/server/staff-setup";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = await listInternalBlockOffs({
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.scope || !body.date || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { message: "scope, date, startTime, and endTime are required." },
        { status: 400 },
      );
    }

    const item = await createInternalBlockOff({
      scope: body.scope,
      staffId: body.staffId ?? null,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason ?? null,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to create block-off.",
      },
      { status: 400 },
    );
  }
}
