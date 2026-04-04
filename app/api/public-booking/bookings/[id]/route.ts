import { NextResponse } from "next/server";
import { getPersistedBookingForPublicView } from "@/src/server/public-booking";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const booking = await getPersistedBookingForPublicView(params.id);

  if (!booking) {
    return NextResponse.json(
      {
        message: `Booking ${params.id} was not found.`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(booking);
}
