import type { AvailabilityQuery, AvailabilitySlot, DurationEstimate } from "@/src/domain/availability/types";
import type { Booking, BookingPaymentSummary, BookingServiceSelections } from "@/src/domain/booking/types";
import type { Staff } from "@/src/domain/staff/types";
import { getSharedBookingRuntime, type SharedRuntimeSource } from "@/src/server/runtime/shared-booking-runtime";

export interface PublicMonthCursor {
  year: number;
  monthIndex: number;
}

export interface PublicCalendarDay {
  key: string;
  iso: string | null;
  dayNumber: number;
  status: "available" | "limited" | "closed" | "outside";
  disabled: boolean;
  outsideMonth: boolean;
}

export interface PublicCalendarMonth {
  monthLabel: string;
  days: PublicCalendarDay[];
}

export interface PublicBookingContextInput {
  visibleMonth: PublicMonthCursor;
  selectedDate?: string | null;
  selectedStaffId: string;
  serviceSelections: BookingServiceSelections;
  activeHoldSlot?: string | null;
}

export interface PublicBookingContextPayload {
  source: SharedRuntimeSource;
  staffOptions: Staff[];
  durationEstimate: DurationEstimate;
  calendarMonth: PublicCalendarMonth;
  slots: AvailabilitySlot[];
}

export async function buildPublicBookingContext(
  input: PublicBookingContextInput,
): Promise<PublicBookingContextPayload> {
  const runtime = await getSharedBookingRuntime();
  const staffMembers = await runtime.repositories.staffRepository.listActive({
    activeOnly: true,
  });
  const staffOptions = [createPoolStaffOption(), ...staffMembers];
  const durationInput = buildDurationInput(
    input.selectedStaffId,
    input.serviceSelections,
  );
  const durationEstimate = await runtime.services.durationService.estimateDuration(
    durationInput,
    input.activeHoldSlot ?? null,
  );
  const calendarMonth = await buildCalendarMonth(
    runtime.services.availabilityService,
    input.visibleMonth,
    input.selectedStaffId,
    input.serviceSelections,
  );
  const slots = input.selectedDate
    ? await buildSlotsForDate(
        runtime.services.availabilityService,
        input.selectedDate,
        input.selectedStaffId,
        input.serviceSelections,
        input.activeHoldSlot ?? null,
      )
    : [];

  return {
    source: runtime.source,
    staffOptions,
    durationEstimate,
    calendarMonth,
    slots,
  };
}

export async function getPersistedBookingForPublicView(id: string) {
  const runtime = await getSharedBookingRuntime();
  const booking = await runtime.services.bookingService.getBookingById(id);

  if (!booking) {
    return null;
  }

  const assignedStaff =
    booking.assignedStaffId
      ? await runtime.repositories.staffRepository.findById(booking.assignedStaffId)
      : null;

  return {
    source: runtime.source,
    booking,
    assignedStaffName: assignedStaff?.displayName ?? null,
  };
}

export function buildPaymentSummary(input: {
  method: BookingPaymentSummary["method"];
  transferReference?: string | null;
  maskedCardNumber?: string | null;
}): BookingPaymentSummary {
  if (input.method === "bank_transfer") {
    return {
      method: "bank_transfer",
      status: "awaiting_bank_transfer",
      detailLabel: "Nội dung chuyển khoản",
      detailValue: input.transferReference ?? "19NAIL-0000",
      capturedAt: null,
    };
  }

  if (input.method === "local_card") {
    return {
      method: "local_card",
      status: "card_details_captured",
      detailLabel: "Thẻ demo",
      detailValue:
        input.maskedCardNumber ?? "•••• •••• •••• ••••",
      capturedAt: null,
    };
  }

  return {
    method: "pay_at_salon",
    status: "pay_at_salon",
    detailLabel: "Thanh toán",
    detailValue: "Thanh toán khi đến lịch",
    capturedAt: null,
  };
}

export function mapPersistedBookingToDraftPatch(booking: Booking) {
  return {
    persistedBookingId: booking.id,
    referenceCode: booking.referenceCode,
    runtimeSource: booking.branchId ? undefined : undefined,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.estimatedEndTime,
    durationMinutes: booking.durationMinutes,
    blockedDurationMinutes: booking.durationMinutes,
    status: booking.status,
    holdSlot: null,
    holdExpiresAt: null,
    latestNotice: null,
  };
}

async function buildCalendarMonth(
  availabilityService: {
    queryAvailability(input: AvailabilityQuery): Promise<{
      slots: AvailabilitySlot[];
    }>;
  },
  cursor: PublicMonthCursor,
  selectedStaffId: string,
  serviceSelections: BookingServiceSelections,
) {
  const firstDay = new Date(cursor.year, cursor.monthIndex, 1);
  const firstWeekdayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.year, cursor.monthIndex + 1, 0).getDate();
  const todayIso = getTodayIsoInShopTimezone();
  const days: PublicCalendarDay[] = [];

  for (let index = 0; index < firstWeekdayOffset; index += 1) {
    const dayNumber =
      new Date(cursor.year, cursor.monthIndex, 0).getDate() -
      firstWeekdayOffset +
      index +
      1;

    days.push({
      key: `outside-prev-${cursor.year}-${cursor.monthIndex}-${dayNumber}`,
      iso: null,
      dayNumber,
      status: "outside",
      disabled: true,
      outsideMonth: true,
    });
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const iso = formatIsoDate(cursor.year, cursor.monthIndex, dayNumber);

    if (iso < todayIso) {
      days.push({
        key: iso,
        iso,
        dayNumber,
        status: "closed",
        disabled: true,
        outsideMonth: false,
      });
      continue;
    }

    const availability = await availabilityService.queryAvailability(
      buildAvailabilityQuery(iso, selectedStaffId, serviceSelections),
    );
    const availableCount = availability.slots.filter(
      (slot) => slot.state === "available",
    ).length;
    const allClosed = availability.slots.every(
      (slot) => slot.state === "closed" || slot.state === "past",
    );
    const status =
      allClosed || availableCount === 0
        ? "closed"
        : availableCount <= 5
          ? "limited"
          : "available";

    days.push({
      key: iso,
      iso,
      dayNumber,
      status,
      disabled: status === "closed",
      outsideMonth: false,
    });
  }

  let trailingDayNumber = 1;
  while (days.length % 7 !== 0 || days.length < 35) {
    days.push({
      key: `outside-next-${cursor.year}-${cursor.monthIndex}-${trailingDayNumber}`,
      iso: null,
      dayNumber: trailingDayNumber,
      status: "outside",
      disabled: true,
      outsideMonth: true,
    });
    trailingDayNumber += 1;
  }

  return {
    monthLabel: `Tháng ${cursor.monthIndex + 1} ${cursor.year}`,
    days,
  } satisfies PublicCalendarMonth;
}

async function buildSlotsForDate(
  availabilityService: {
    queryAvailability(input: AvailabilityQuery): Promise<{
      slots: AvailabilitySlot[];
    }>;
  },
  date: string,
  selectedStaffId: string,
  serviceSelections: BookingServiceSelections,
  activeHoldSlot: string | null,
) {
  const availability = await availabilityService.queryAvailability(
    buildAvailabilityQuery(date, selectedStaffId, serviceSelections),
  );

  if (!activeHoldSlot) {
    return availability.slots;
  }

  return availability.slots.map((slot) =>
    slot.startTime === activeHoldSlot
      ? {
          ...slot,
          state: "available" as const,
          reason: null,
          invalidationReasonCode: null,
        }
      : slot,
  );
}

function buildAvailabilityQuery(
  date: string,
  selectedStaffId: string,
  serviceSelections: BookingServiceSelections,
): AvailabilityQuery {
  return {
    date,
    branchId: "19nail-main",
    requestedStaffId: selectedStaffId === "any" ? null : selectedStaffId,
    staffAssignmentMode: selectedStaffId === "any" ? "pool" : "specific_staff",
    durationInput: buildDurationInput(selectedStaffId, serviceSelections),
    slotIntervalMinutes: 30,
    includeAlternativeDates: true,
  };
}

function buildDurationInput(
  selectedStaffId: string,
  serviceSelections: BookingServiceSelections,
): AvailabilityQuery["durationInput"] {
  return {
    guestCount: serviceSelections.guestCount,
    setType: serviceSelections.setType,
    nailType: serviceSelections.nailType,
    polishStyle: serviceSelections.polishStyle,
    effects: serviceSelections.effects,
    branchId: "19nail-main",
    requestedStaffId: selectedStaffId === "any" ? null : selectedStaffId,
    staffAssignmentMode: selectedStaffId === "any" ? "pool" : "specific_staff",
    processingStrategy: "sequential",
  };
}

function createPoolStaffOption(): Staff {
  return {
    id: "any",
    displayName: "Bất kỳ thợ nào",
    initials: "☆",
    branchId: "19nail-main",
    active: true,
    sortOrder: 0,
    role: "staff",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getTodayIsoInShopTimezone(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "04";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function formatIsoDate(year: number, monthIndex: number, dayNumber: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(
    dayNumber,
  ).padStart(2, "0")}`;
}
