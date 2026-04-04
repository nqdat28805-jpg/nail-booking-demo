import { NextResponse } from "next/server";
import { updateInternalDurationRule } from "@/src/server/staff-setup";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const item = await updateInternalDurationRule(id, {
      baseDurationMinutes:
        body.baseDurationMinutes === undefined
          ? undefined
          : Number(body.baseDurationMinutes),
      blockRoundToMinutes:
        body.blockRoundToMinutes === undefined
          ? undefined
          : Number(body.blockRoundToMinutes),
      guestCountStrategy: body.guestCountStrategy,
      guestCountMultiplier:
        body.guestCountMultiplier === undefined
          ? undefined
          : Number(body.guestCountMultiplier),
      active:
        body.active === undefined ? undefined : Boolean(body.active),
      notes: body.notes ?? undefined,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update duration rule.",
      },
      { status: 400 },
    );
  }
}
