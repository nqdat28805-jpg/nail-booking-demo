import { NextResponse } from "next/server";
import { createInternalStaff, listInternalStaff } from "@/src/server/staff-setup";

export async function GET() {
  const payload = await listInternalStaff();
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.displayName?.trim()) {
      return NextResponse.json(
        { message: "displayName is required." },
        { status: 400 },
      );
    }

    const staff = await createInternalStaff({
      displayName: body.displayName,
      initials: body.initials ?? null,
      active: body.active ?? true,
      sortOrder:
        typeof body.sortOrder === "number" ? body.sortOrder : Number(body.sortOrder ?? 0),
    });

    return NextResponse.json({ item: staff }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to create staff.",
      },
      { status: 400 },
    );
  }
}
