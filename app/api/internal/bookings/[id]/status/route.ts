import { NextResponse } from "next/server";
import { applyInternalBookingAction } from "@/src/server/staff-calendar";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const booking = await applyInternalBookingAction({
      bookingId: id,
      action: body.action,
      reason: body.reason ?? null,
    });

    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update booking status.",
      },
      { status: 400 },
    );
  }
}
