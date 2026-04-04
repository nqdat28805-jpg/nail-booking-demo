import { NextResponse } from "next/server";
import { buildPublicBookingContext } from "@/src/server/public-booking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = await buildPublicBookingContext({
      visibleMonth: body.visibleMonth,
      selectedDate: body.selectedDate ?? null,
      selectedStaffId: body.selectedStaffId ?? "any",
      serviceSelections: body.serviceSelections,
      activeHoldSlot: body.activeHoldSlot ?? null,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to build booking context.",
      },
      { status: 400 },
    );
  }
}
