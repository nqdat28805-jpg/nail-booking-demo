import { NextResponse } from "next/server";
import { deleteInternalBlockOff } from "@/src/server/staff-setup";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await deleteInternalBlockOff(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to delete block-off.",
      },
      { status: 400 },
    );
  }
}
