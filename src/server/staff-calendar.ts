import type { BookingStatus } from "@/src/domain/booking/types";
import { getSharedBookingRuntime } from "@/src/server/runtime/shared-booking-runtime";
import { INTERNAL_SETUP_BRANCH_ID } from "@/src/server/staff-setup";

export type InternalCalendarAction =
  | "confirm"
  | "check_in"
  | "complete"
  | "cancel"
  | "no_show";

export async function listInternalCalendarBookings(input: {
  date: string;
  staffId?: string | null;
  status?: BookingStatus | "all" | null;
}) {
  const runtime = await getSharedBookingRuntime();
  const staffMembers = await runtime.repositories.staffRepository.listActive({
    branchId: INTERNAL_SETUP_BRANCH_ID,
    activeOnly: false,
  });
  const bookings = await runtime.repositories.bookingRepository.listByDateRange({
    branchId: INTERNAL_SETUP_BRANCH_ID,
    dateFrom: input.date,
    dateTo: input.date,
    staffIds:
      input.staffId && input.staffId !== "all" ? [input.staffId] : undefined,
    statuses:
      input.status && input.status !== "all" ? [input.status] : undefined,
  });

  const staffById = new Map(staffMembers.map((staff) => [staff.id, staff]));
  const items = bookings
    .slice()
    .sort((left, right) => {
      if (left.startTime !== right.startTime) {
        return left.startTime.localeCompare(right.startTime);
      }

      return left.referenceCode.localeCompare(right.referenceCode);
    })
    .map((booking) => ({
      booking,
      assignedStaffName: booking.assignedStaffId
        ? staffById.get(booking.assignedStaffId)?.displayName ?? booking.assignedStaffId
        : null,
      staffGroupKey: booking.assignedStaffId ?? "pool",
      staffGroupLabel: booking.assignedStaffId
        ? staffById.get(booking.assignedStaffId)?.displayName ?? booking.assignedStaffId
        : "Pool / chưa chỉ định",
    }));

  return {
    source: runtime.source,
    date: input.date,
    staffOptions: staffMembers,
    items,
  };
}

export async function applyInternalBookingAction(input: {
  bookingId: string;
  action: InternalCalendarAction;
  reason?: string | null;
}) {
  const runtime = await getSharedBookingRuntime();
  const booking = await runtime.repositories.bookingRepository.findById(input.bookingId);

  if (!booking) {
    throw new Error(`Booking ${input.bookingId} was not found.`);
  }

  switch (input.action) {
    case "confirm":
      return runtime.services.bookingService.confirmBooking(input.bookingId);
    case "check_in":
      if (booking.status === "pending") {
        await runtime.services.bookingService.confirmBooking(input.bookingId);
      }
      return runtime.services.bookingService.checkInBooking(input.bookingId);
    case "complete":
      return runtime.services.bookingService.completeBooking(
        input.bookingId,
        new Date().toISOString(),
      );
    case "cancel":
      return runtime.services.bookingService.cancelBooking(
        input.bookingId,
        input.reason?.trim() || "Cancelled from staff calendar MVP.",
      );
    case "no_show":
      if (booking.status === "pending") {
        await runtime.services.bookingService.confirmBooking(input.bookingId);
      }
      return runtime.services.bookingService.noShowBooking(
        input.bookingId,
        input.reason?.trim() || "Marked as no-show from technician screen.",
      );
    default:
      throw new Error("Unsupported booking action.");
  }
}
