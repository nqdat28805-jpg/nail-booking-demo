import { NextResponse } from "next/server";
import { getInternalStaffSchedules, replaceInternalStaffSchedules } from "@/src/server/staff-setup";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");

  if (!staffId) {
    return NextResponse.json(
      { message: "staffId is required." },
      { status: 400 },
    );
  }

  const payload = await getInternalStaffSchedules(staffId);
  return NextResponse.json(payload);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.staffId || !Array.isArray(body.schedules)) {
      return NextResponse.json(
        { message: "staffId and schedules are required." },
        { status: 400 },
      );
    }

    const schedules = await replaceInternalStaffSchedules({
      staffId: body.staffId,
      schedules: body.schedules.map((schedule: any) => ({
        dayOfWeek: Number(schedule.dayOfWeek),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isWorkingDay: Boolean(schedule.isWorkingDay),
        breakRanges: Array.isArray(schedule.breakRanges) ? schedule.breakRanges : [],
      })),
    });

    return NextResponse.json({ items: schedules });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update weekly schedules.",
      },
      { status: 400 },
    );
  }
}
