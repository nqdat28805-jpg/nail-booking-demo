import type {
  AvailabilityInvalidationReasonCode,
  AvailabilityQuery,
  AvailabilityResult,
  AvailabilitySlot,
  AvailabilitySlotState,
  DurationEstimate,
  TemporaryHold,
} from "@/src/domain/availability/types";
import type { Booking } from "@/src/domain/booking/types";
import type { BlockOff, Staff, StaffWorkingSchedule } from "@/src/domain/staff/types";

export interface AvailabilityEngineBusinessHours {
  openTime: string;
  closeTime: string;
}

export interface AvailabilityEngineInput {
  query: AvailabilityQuery;
  estimate: DurationEstimate;
  staffMembers: Staff[];
  schedules: StaffWorkingSchedule[];
  bookings: Booking[];
  blockOffs: BlockOff[];
  temporaryHolds: TemporaryHold[];
  businessHours: AvailabilityEngineBusinessHours;
  generatedAt?: string;
  now?: Date;
  collapseContinuationStates?: boolean;
}

export interface AvailabilityEngineSlotDiagnostic {
  startTime: string;
  staffId: string;
  state: AvailabilitySlotState;
  continuousFreeMinutes: number;
  invalidationReasonCode?: AvailabilityInvalidationReasonCode | null;
  reason?: string | null;
}

export interface AvailabilityEngineResult extends AvailabilityResult {
  validStartSlots: string[];
  alternativeSlots: string[];
  diagnostics: AvailabilityEngineSlotDiagnostic[];
}

type BaseSlotState = Exclude<AvailabilitySlotState, "insufficient_duration">;

type StaffSlotSnapshot = {
  state: BaseSlotState;
  continuousFreeMinutes: number;
  invalidationReasonCode?: AvailabilityInvalidationReasonCode | null;
  reason?: string | null;
};

const DEFAULT_REASON_COPY: Record<
  Exclude<AvailabilitySlotState, "available">,
  string
> = {
  booked: "Khung giờ này đã được đặt trước.",
  held: "Khung giờ này đang được giữ tạm.",
  past: "Khung giờ này đã qua.",
  closed: "Khung giờ này nằm ngoài thời gian làm việc.",
  continuation: "Khung giờ này là phần tiếp nối của một khoảng đang bị chiếm chỗ.",
  insufficient_duration:
    "Khung giờ này chưa đủ thời lượng liên tục cho tổ hợp dịch vụ hiện tại.",
};

export function runAvailabilityEngine(
  input: AvailabilityEngineInput,
): AvailabilityEngineResult {
  const now = input.now ?? new Date();
  const generatedAt = input.generatedAt ?? now.toISOString();
  const slotTimes = createSlotTimes(
    input.businessHours.openTime,
    input.businessHours.closeTime,
    input.query.slotIntervalMinutes,
  );
  const targetStaff =
    input.query.staffAssignmentMode === "specific_staff" &&
    input.query.requestedStaffId
      ? input.staffMembers.filter(
          (staff) => staff.id === input.query.requestedStaffId,
        )
      : input.staffMembers.filter((staff) => staff.active);
  const perStaff = targetStaff.map((staff) =>
    buildStaffSlotMap({
      query: input.query,
      estimate: input.estimate,
      staff,
      schedules: input.schedules,
      bookings: input.bookings,
      blockOffs: input.blockOffs,
      temporaryHolds: input.temporaryHolds,
      businessHours: input.businessHours,
      slotTimes,
      now,
      collapseContinuationStates: input.collapseContinuationStates ?? true,
    }),
  );
  const diagnostics: AvailabilityEngineSlotDiagnostic[] = [];
  const slots = slotTimes.map((startTime) => {
    const staffSnapshots = perStaff.map((map) => map[startTime]);

    for (const [index, snapshot] of staffSnapshots.entries()) {
      diagnostics.push({
        startTime,
        staffId: targetStaff[index]?.id ?? "unknown",
        state: snapshot.state,
        continuousFreeMinutes: snapshot.continuousFreeMinutes,
        invalidationReasonCode: snapshot.invalidationReasonCode ?? null,
        reason: snapshot.reason ?? null,
      });
    }

    const availableSnapshots = staffSnapshots.filter(
      (snapshot) =>
        snapshot.state === "available" &&
        snapshot.continuousFreeMinutes >= input.estimate.blockedDurationMinutes,
    );

    if (availableSnapshots.length > 0) {
      return {
        startTime,
        endTime: addMinutesToTime(
          startTime,
          input.estimate.blockedDurationMinutes,
        ),
        state: "available",
        reason: null,
        invalidationReasonCode: null,
        continuousFreeMinutes: Math.max(
          ...availableSnapshots.map((snapshot) => snapshot.continuousFreeMinutes),
        ),
        availableStaffIds: targetStaff
          .filter((staff, index) => {
            const snapshot = staffSnapshots[index];
            return (
              snapshot?.state === "available" &&
              snapshot.continuousFreeMinutes >=
                input.estimate.blockedDurationMinutes
            );
          })
          .map((staff) => staff.id),
        holdExpiresAt: null,
        alternativeStartTimes: [],
      } satisfies AvailabilitySlot;
    }

    const maxFreeMinutes = staffSnapshots.reduce(
      (best, snapshot) => Math.max(best, snapshot.continuousFreeMinutes),
      0,
    );
    const aggregateState = resolveAggregateSlotState(staffSnapshots);
    const reason =
      staffSnapshots.find((snapshot) => snapshot.reason)?.reason ??
      DEFAULT_REASON_COPY[aggregateState];
    const invalidationReasonCode =
      staffSnapshots.find((snapshot) => snapshot.invalidationReasonCode)
        ?.invalidationReasonCode ??
      getDefaultInvalidationCode(aggregateState);

    return {
      startTime,
      endTime: addMinutesToTime(
        startTime,
        input.estimate.blockedDurationMinutes,
      ),
      state: aggregateState,
      reason,
      invalidationReasonCode,
      continuousFreeMinutes: maxFreeMinutes,
      availableStaffIds: [],
      holdExpiresAt: null,
      alternativeStartTimes: [],
    } satisfies AvailabilitySlot;
  });

  const validStartSlots = slots
    .filter((slot) => slot.state === "available")
    .map((slot) => slot.startTime);
  const alternativeSlots = validStartSlots.slice(0, 4);

  return {
    date: input.query.date,
    query: input.query,
    estimate: input.estimate,
    slots,
    suggestedDates: [],
    generatedAt,
    validStartSlots,
    alternativeSlots,
    diagnostics,
  };
}

function buildStaffSlotMap(input: {
  query: AvailabilityQuery;
  estimate: DurationEstimate;
  staff: Staff;
  schedules: StaffWorkingSchedule[];
  bookings: Booking[];
  blockOffs: BlockOff[];
  temporaryHolds: TemporaryHold[];
  businessHours: AvailabilityEngineBusinessHours;
  slotTimes: string[];
  now: Date;
  collapseContinuationStates: boolean;
}) {
  const slotMap: Record<string, StaffSlotSnapshot> = {};
  const daySchedule = input.schedules.find(
    (schedule) =>
      schedule.staffId === input.staff.id &&
      schedule.dayOfWeek === getIsoWeekday(input.query.date) &&
      isScheduleEffectiveOnDate(schedule, input.query.date),
  );
  const currentIso = toIsoDate(input.now);
  const nowMinutes = input.now.getHours() * 60 + input.now.getMinutes();
  const scheduleStartMinutes = convertTimeToMinutes(
    daySchedule?.startTime ?? input.businessHours.openTime,
  );
  const scheduleEndMinutes = convertTimeToMinutes(
    daySchedule?.endTime ?? input.businessHours.closeTime,
  );

  for (const slotTime of input.slotTimes) {
    const slotMinutes = convertTimeToMinutes(slotTime);
    const occupiedByBooking = getOccupyingBooking(
      input.bookings,
      input.staff.id,
      input.query.date,
      slotMinutes,
    );
    const occupiedByHold = getOccupyingTemporaryHold(
      input.temporaryHolds,
      input.staff.id,
      input.query.date,
      slotMinutes,
    );
    const activeBlock = getActiveBlockOff(
      input.blockOffs,
      input.staff.id,
      input.query.date,
      slotMinutes,
    );

    let state: BaseSlotState = "available";
    let invalidationReasonCode: AvailabilityInvalidationReasonCode | null = null;
    let reason: string | null = null;

    if (
      !daySchedule ||
      !daySchedule.isWorkingDay ||
      slotMinutes < scheduleStartMinutes ||
      slotMinutes >= scheduleEndMinutes
    ) {
      state = "closed";
      invalidationReasonCode = "outside_working_schedule";
    } else if (
      input.query.date < currentIso ||
      (input.query.date === currentIso && slotMinutes < nowMinutes)
    ) {
      state = "past";
      invalidationReasonCode = "past_time";
    } else if (activeBlock) {
      state = "closed";
      invalidationReasonCode = "block_off";
      reason = activeBlock.reason ?? activeBlock.title;
    } else if (occupiedByHold) {
      state = occupiedByHold.startTime === slotTime ? "held" : "continuation";
      invalidationReasonCode =
        occupiedByHold.startTime === slotTime
          ? "temporary_hold"
          : "continuation_segment";
    } else if (occupiedByBooking) {
      state = occupiedByBooking.startTime === slotTime ? "booked" : "continuation";
      invalidationReasonCode =
        occupiedByBooking.startTime === slotTime
          ? "existing_booking"
          : "continuation_segment";
    }

    slotMap[slotTime] = {
      state:
        input.collapseContinuationStates && state === "continuation"
          ? occupiedByHold
            ? "held"
            : "booked"
          : state,
      continuousFreeMinutes: 0,
      invalidationReasonCode,
      reason,
    };
  }

  for (let index = 0; index < input.slotTimes.length; index += 1) {
    const slotTime = input.slotTimes[index];
    const snapshot = slotMap[slotTime];

    if (!snapshot || snapshot.state !== "available") {
      continue;
    }

    let continuousFreeMinutes = 0;

    for (
      let nextIndex = index;
      nextIndex < input.slotTimes.length;
      nextIndex += 1
    ) {
      const nextTime = input.slotTimes[nextIndex];
      const nextSnapshot = slotMap[nextTime];

      if (!nextSnapshot || nextSnapshot.state !== "available") {
        break;
      }

      continuousFreeMinutes += input.query.slotIntervalMinutes;
    }

    if (continuousFreeMinutes < input.estimate.blockedDurationMinutes) {
      snapshot.continuousFreeMinutes = continuousFreeMinutes;
      snapshot.invalidationReasonCode = "insufficient_contiguous_time";
      snapshot.reason = DEFAULT_REASON_COPY.insufficient_duration;
      continue;
    }

    snapshot.continuousFreeMinutes = continuousFreeMinutes;
  }

  return slotMap;
}

function resolveAggregateSlotState(
  staffSnapshots: StaffSlotSnapshot[],
): Exclude<AvailabilitySlotState, "available"> {
  if (staffSnapshots.length === 0) {
    return "closed";
  }

  const states = staffSnapshots.map((snapshot) => snapshot.state);
  const hasOpenWindow = staffSnapshots.some(
    (snapshot) =>
      snapshot.state === "available" && snapshot.continuousFreeMinutes > 0,
  );

  if (states.every((state) => state === "past")) {
    return "past";
  }

  if (states.every((state) => state === "closed")) {
    return "closed";
  }

  if (states.some((state) => state === "held")) {
    return "held";
  }

  if (hasOpenWindow) {
    return "insufficient_duration";
  }

  if (states.some((state) => state === "booked")) {
    return "booked";
  }

  if (states.some((state) => state === "continuation")) {
    return "continuation";
  }

  return "closed";
}

function getDefaultInvalidationCode(
  state: Exclude<AvailabilitySlotState, "available">,
): AvailabilityInvalidationReasonCode {
  switch (state) {
    case "booked":
      return "existing_booking";
    case "held":
      return "temporary_hold";
    case "past":
      return "past_time";
    case "continuation":
      return "continuation_segment";
    case "insufficient_duration":
      return "insufficient_contiguous_time";
    default:
      return "outside_working_schedule";
  }
}

function getOccupyingBooking(
  bookings: Booking[],
  staffId: string,
  date: string,
  slotMinutes: number,
) {
  return bookings.find((booking) => {
    if (booking.date !== date || booking.assignedStaffId !== staffId) {
      return false;
    }

    const bookingStart = convertTimeToMinutes(booking.startTime);
    const bookingEnd = convertTimeToMinutes(booking.estimatedEndTime);
    return slotMinutes >= bookingStart && slotMinutes < bookingEnd;
  });
}

function getOccupyingTemporaryHold(
  temporaryHolds: TemporaryHold[],
  staffId: string,
  date: string,
  slotMinutes: number,
) {
  return temporaryHolds.find((hold) => {
    if (hold.date !== date || hold.status !== "active" || hold.staffId !== staffId) {
      return false;
    }

    const holdStart = convertTimeToMinutes(hold.startTime);
    const holdEnd = convertTimeToMinutes(hold.endTime);
    return slotMinutes >= holdStart && slotMinutes < holdEnd;
  });
}

function getActiveBlockOff(
  blockOffs: BlockOff[],
  staffId: string,
  date: string,
  slotMinutes: number,
) {
  return blockOffs.find((block) => {
    if (!block.active) {
      return false;
    }

    const startDate = toIsoDate(new Date(block.startAt));
    if (startDate !== date) {
      return false;
    }

    const appliesToStaff =
      block.scope === "global" ||
      block.scope === "branch" ||
      block.staffId === staffId;
    if (!appliesToStaff) {
      return false;
    }

    const start = new Date(block.startAt);
    const end = new Date(block.endAt);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  });
}

function createSlotTimes(openTime: string, closeTime: string, step: number) {
  const times: string[] = [];
  const openMinutes = convertTimeToMinutes(openTime);
  const closeMinutes = convertTimeToMinutes(closeTime);

  for (let cursor = openMinutes; cursor <= closeMinutes - step; cursor += step) {
    times.push(convertMinutesToTime(cursor));
  }

  return times;
}

function convertTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function convertMinutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  return convertMinutesToTime(convertTimeToMinutes(time) + minutesToAdd);
}

function getIsoWeekday(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).getDay() as StaffWorkingSchedule["dayOfWeek"];
}

function isScheduleEffectiveOnDate(schedule: StaffWorkingSchedule, date: string) {
  if (schedule.effectiveFrom && schedule.effectiveFrom > date) {
    return false;
  }

  if (schedule.effectiveTo && schedule.effectiveTo < date) {
    return false;
  }

  return true;
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}
