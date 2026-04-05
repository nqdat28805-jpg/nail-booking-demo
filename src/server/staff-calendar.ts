import type { Booking, BookingStatus } from "@/src/domain/booking/types";
import { getSharedBookingRuntime } from "@/src/server/runtime/shared-booking-runtime";
import { INTERNAL_SETUP_BRANCH_ID } from "@/src/server/staff-setup";

const BANGKOK_TIME_ZONE = "Asia/Bangkok";
const LATE_SHOW_THRESHOLD_MINUTES = 15;
const NO_SHOW_THRESHOLD_MINUTES = 30;
const AUTO_CANCEL_THRESHOLD_MINUTES = 60;
const AUTO_CANCEL_REASON =
  "Tự động huỷ lịch sau 60 phút quá giờ mà khách chưa check-in.";

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
  const rawBookings = await runtime.repositories.bookingRepository.listByDateRange({
    branchId: INTERNAL_SETUP_BRANCH_ID,
    dateFrom: input.date,
    dateTo: input.date,
    staffIds:
      input.staffId && input.staffId !== "all" ? [input.staffId] : undefined,
  });
  const bookings = await resolveOperationalCalendarBookings({
    bookings: rawBookings,
    selectedDate: input.date,
  });

  const staffById = new Map(staffMembers.map((staff) => [staff.id, staff]));
  const items = bookings
    .map((booking) => {
      const effectiveStatus = getOperationalBookingStatus(booking, input.date);

      return {
        booking,
        effectiveStatus,
        assignedStaffName: booking.assignedStaffId
          ? staffById.get(booking.assignedStaffId)?.displayName ?? booking.assignedStaffId
          : null,
        staffGroupKey: booking.assignedStaffId ?? "pool",
        staffGroupLabel: booking.assignedStaffId
          ? staffById.get(booking.assignedStaffId)?.displayName ?? booking.assignedStaffId
          : "Pool / chưa chỉ định",
      };
    })
    .filter((item) =>
      input.status && input.status !== "all"
        ? item.effectiveStatus === input.status
        : true,
    )
    .sort((left, right) => {
      const leftRank = getAgendaStatusRank(left.effectiveStatus);
      const rightRank = getAgendaStatusRank(right.effectiveStatus);

      if (left.staffGroupLabel !== right.staffGroupLabel) {
        return left.staffGroupLabel.localeCompare(right.staffGroupLabel);
      }

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      if (left.booking.startTime !== right.booking.startTime) {
        return left.booking.startTime.localeCompare(right.booking.startTime);
      }

      return left.booking.referenceCode.localeCompare(right.booking.referenceCode);
    });

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
        input.reason?.trim() || "Huỷ lịch từ màn lịch làm việc nội bộ.",
      );
    case "no_show":
      if (booking.status === "pending") {
        await runtime.services.bookingService.confirmBooking(input.bookingId);
      }
      return runtime.services.bookingService.noShowBooking(
        input.bookingId,
        input.reason?.trim() || "Đánh dấu vắng mặt từ màn kỹ thuật viên.",
      );
    default:
      throw new Error("Unsupported booking action.");
  }
}

async function resolveOperationalCalendarBookings(input: {
  bookings: Booking[];
  selectedDate: string;
}) {
  const runtime = await getSharedBookingRuntime();
  const resolved: Booking[] = [];

  for (const booking of input.bookings) {
    const effectiveStatus = getOperationalBookingStatus(booking, input.selectedDate);

    if (effectiveStatus === "cancelled" && booking.status !== "cancelled") {
      const cancelled = await runtime.services.bookingService.cancelBooking(
        booking.id,
        AUTO_CANCEL_REASON,
      );
      resolved.push(cancelled);
      continue;
    }

    resolved.push(booking);
  }

  return resolved;
}

function getOperationalBookingStatus(
  booking: Booking,
  selectedDate: string,
): BookingStatus {
  if (booking.status === "checked_in" || booking.status === "completed") {
    return booking.status;
  }

  if (booking.status === "cancelled") {
    return "cancelled";
  }

  const now = getBangkokNow();

  if (booking.date !== now.date || selectedDate !== now.date) {
    return booking.status;
  }

  const elapsedMinutes = getElapsedMinutesSinceStart(booking.startTime, now.time);

  if (elapsedMinutes < LATE_SHOW_THRESHOLD_MINUTES) {
    return booking.status;
  }

  if (elapsedMinutes >= AUTO_CANCEL_THRESHOLD_MINUTES) {
    return "cancelled";
  }

  if (elapsedMinutes >= NO_SHOW_THRESHOLD_MINUTES) {
    return "no_show";
  }

  return "late_show";
}

function getAgendaStatusRank(status: BookingStatus) {
  switch (status) {
    case "checked_in":
      return 0;
    case "confirmed":
    case "pending":
    case "late_show":
    case "no_show":
      return 1;
    case "completed":
      return 2;
    case "cancelled":
      return 3;
    default:
      return 4;
  }
}

function getElapsedMinutesSinceStart(startTime: string, nowTime: string) {
  return convertTimeToMinutes(nowTime) - convertTimeToMinutes(startTime);
}

function convertTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getBangkokNow() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  const hour = parts.hour === "24" ? "00" : parts.hour;

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`,
  };
}
