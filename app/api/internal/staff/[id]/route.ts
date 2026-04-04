import { NextResponse } from "next/server";
import { updateInternalStaff } from "@/src/server/staff-setup";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const staff = await updateInternalStaff(id, {
      displayName: body.displayName,
      initials: body.initials,
      active:
        typeof body.active === "boolean"
          ? body.active
          : body.active === undefined
            ? undefined
            : Boolean(body.active),
      sortOrder:
        body.sortOrder === undefined ? undefined : Number(body.sortOrder),
    });

    return NextResponse.json({ item: staff });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to update staff.",
      },
      { status: 400 },
    );
  }
}
