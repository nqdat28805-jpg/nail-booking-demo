import { NextResponse } from "next/server";
import { listInternalCalendarBookings } from "@/src/server/staff-calendar";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { message: "date is required." },
        { status: 400 },
      );
    }

    const payload = await listInternalCalendarBookings({
      date,
      staffId: searchParams.get("staffId"),
      status: searchParams.get("status") as any,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to list internal bookings.",
      },
      { status: 400 },
    );
  }
}
