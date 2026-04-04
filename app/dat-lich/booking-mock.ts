import type {
  AvailabilityQuery,
  AvailabilitySlot,
  AvailabilitySlotState,
  DurationEstimate,
  DurationInput,
} from "@/src/domain/availability/types";
import { WEB_DEFAULT_BOOKING_STATUS } from "@/src/domain/booking/lifecycle";
import type {
  Booking,
  BookingChannel,
  BookingServiceSelections,
  BookingSource,
  BookingStatus,
  EffectOption,
  NailType,
  PolishStyle,
  SetType,
  StaffAssignmentMode,
} from "@/src/domain/booking/types";
import type { ServiceDurationRule } from "@/src/domain/config/types";
import type { BlockOff, Staff, StaffWorkingSchedule } from "@/src/domain/staff/types";

export type DayStatus = "available" | "limited" | "closed";
export type SlotState = AvailabilitySlotState;
export type ServiceSelections = BookingServiceSelections;
export type StaffOption = Staff;

export type CalendarDay = {
  key: string;
  iso: string | null;
  dayNumber: number;
  status: DayStatus | "outside";
  disabled: boolean;
  outsideMonth: boolean;
};

export type BookingCalendarMonth = {
  monthLabel: string;
  days: CalendarDay[];
};

export type SlotOption = AvailabilitySlot;

export type BookingFlowNotice = {
  type:
    | "hold_expired"
    | "recheck_conflict"
    | "slot_invalidated"
    | "insufficient_duration";
  message: string;
  alternativeSlots: string[];
};

export type PersistedBookingDraft = {
  date: string | null;
  dateLabel: string | null;
  startTime: string | null;
  staffId: string;
  staffName: string;
  durationMinutes: number;
  durationEstimate: DurationEstimate;
  endTime: string | null;
  slotIntervalMinutes: number;
  holdSlot: string | null;
  holdExpiresAt: number | null;
  status: "draft" | BookingStatus;
  latestNotice: BookingFlowNotice | null;
  serviceSelections: ServiceSelections;
  serviceLabel: string;
  blockedDurationMinutes: number;
  source: BookingSource;
  channel: BookingChannel;
  branchId?: string | null;
  availabilityMode: StaffAssignmentMode;
  availabilityQuery: AvailabilityQuery;
};

export type PersistedGuestDetailsDraft = {
  fullName: string;
  phone: string;
  normalizedPhone: string;
  phoneE164: string;
  guestCount: string;
  setType: string;
  nailType: string;
  polishStyle: string;
  effect: string;
  note: string;
  serviceLabel: string;
  paymentMethod: PaymentMethod;
  paymentDetails: PersistedPaymentDetails | null;
};

export type PaymentMethod =
  | "pay_at_salon"
  | "bank_transfer"
  | "local_card";

export type PersistedPaymentDetails = {
  cardNumber?: string;
  cardholderName?: string;
  expiry?: string;
  cvv?: string;
  transferReference?: string;
};

export const BOOKING_STORAGE_KEY = "nail-booking-draft";
export const GUEST_DETAILS_STORAGE_KEY = "nail-guest-details";
export const BOOKING_STORAGE_UPDATED_EVENT = "booking-storage-updated";
export const GUEST_STORAGE_UPDATED_EVENT = "guest-storage-updated";
export const DEFAULT_WEB_BOOKING_STATUS = WEB_DEFAULT_BOOKING_STATUS;
export const MOCK_TODAY_ISO = "2026-04-01";
export const MOCK_CURRENT_TIME = "11:30";
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = "pay_at_salon";
export const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const TEMP_HOLD_DURATION_MS = 5 * 60 * 1000;
export const SLOT_INTERVAL_MINUTES = 30;
export const SALON_OPEN_MINUTES = 9 * 60;
export const SALON_CLOSE_MINUTES = 21 * 60;
export const INSUFFICIENT_DURATION_MESSAGE =
  "Vui lòng điều chỉnh dịch vụ để vừa khoảng thời gian còn trống.";

export const DEFAULT_SERVICE_SELECTIONS: ServiceSelections = {
  guestCount: 1,
  setType: "hands",
  nailType: "natural",
  polishStyle: "gel_solid",
  effects: ["none"],
};

export const GUEST_COUNT_OPTIONS = Array.from({ length: 10 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1} người`,
}));

export const SET_COUNT_OPTIONS = [
  { value: "hands", label: "Tay" },
  { value: "feet", label: "Chân" },
  { value: "both", label: "Tay và chân" },
] as const;

export const NAIL_TYPE_OPTIONS = [
  { value: "natural", label: "Móng thật" },
  { value: "tip", label: "Móng úp" },
  { value: "builder_gel", label: "Đắp Gel" },
] as const;

export const POLISH_STYLE_OPTIONS = [
  { value: "gel_solid", label: "Sơn trơn gel" },
  { value: "glitter", label: "Sơn nhũ" },
  { value: "cat_eye", label: "Mắt mèo" },
  { value: "chrome", label: "Tráng gương" },
] as const;

export const EFFECT_OPTIONS = [
  { value: "none", label: "Không có" },
  { value: "sticker", label: "Đính đá / Sticker" },
  { value: "design", label: "Vẽ design" },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "pay_at_salon", label: "Thanh toán tại salon" },
  { value: "bank_transfer", label: "Chuyển khoản" },
  { value: "local_card", label: "Thẻ nội địa" },
] as const;

export const STAFF_OPTIONS: StaffOption[] = [
  createStaff("any", "Bất kỳ thợ nào", "☆"),
  createStaff("mia", "Thảo", "TH"),
  createStaff("bella", "Linh", "LI"),
  createStaff("elena", "Nga", "NG"),
];

const BOOKABLE_STAFF_IDS = STAFF_OPTIONS.filter((option) => option.id !== "any").map(
  (option) => option.id,
);

const EFFECT_EXTRA_MINUTES: Record<Exclude<EffectOption, "none">, number> = {
  sticker: 15,
  design: 30,
};

const MOCK_SERVICE_DURATION_RULES: ServiceDurationRule[] = [
  createDurationRule("rule-hands-natural-gel", "hands", "natural", "gel_solid", 45),
  createDurationRule("rule-feet-natural-gel", "feet", "natural", "gel_solid", 45),
  createDurationRule("rule-both-natural-gel", "both", "natural", "gel_solid", 90),
  createDurationRule("rule-hands-natural-glitter", "hands", "natural", "glitter", 60),
  createDurationRule("rule-feet-natural-glitter", "feet", "natural", "glitter", 60),
  createDurationRule("rule-both-natural-glitter", "both", "natural", "glitter", 120),
  createDurationRule("rule-hands-tip-gel", "hands", "tip", "gel_solid", 60),
  createDurationRule("rule-feet-tip-gel", "feet", "tip", "gel_solid", 60),
  createDurationRule("rule-both-tip-gel", "both", "tip", "gel_solid", 120),
  createDurationRule("rule-hands-tip-glitter", "hands", "tip", "glitter", 90),
  createDurationRule("rule-feet-tip-glitter", "feet", "tip", "glitter", 90),
  createDurationRule("rule-both-tip-glitter", "both", "tip", "glitter", 150),
  createDurationRule("rule-hands-builder-gel", "hands", "builder_gel", "gel_solid", 90),
  createDurationRule("rule-feet-builder-gel", "feet", "builder_gel", "gel_solid", 90),
  createDurationRule("rule-both-builder-gel", "both", "builder_gel", "gel_solid", 150),
  createDurationRule("rule-hands-builder-glitter", "hands", "builder_gel", "glitter", 120),
  createDurationRule("rule-feet-builder-glitter", "feet", "builder_gel", "glitter", 120),
  createDurationRule("rule-both-builder-glitter", "both", "builder_gel", "glitter", 180),
  createDurationRule("rule-hands-natural-cat", "hands", "natural", "cat_eye", 75),
  createDurationRule("rule-feet-natural-cat", "feet", "natural", "cat_eye", 75),
  createDurationRule("rule-both-natural-cat", "both", "natural", "cat_eye", 120),
  createDurationRule("rule-hands-tip-cat", "hands", "tip", "cat_eye", 105),
  createDurationRule("rule-feet-tip-cat", "feet", "tip", "cat_eye", 105),
  createDurationRule("rule-both-tip-cat", "both", "tip", "cat_eye", 150),
  createDurationRule("rule-hands-builder-cat", "hands", "builder_gel", "cat_eye", 135),
  createDurationRule("rule-feet-builder-cat", "feet", "builder_gel", "cat_eye", 135),
  createDurationRule("rule-both-builder-cat", "both", "builder_gel", "cat_eye", 195),
  createDurationRule("rule-hands-natural-chrome", "hands", "natural", "chrome", 75),
  createDurationRule("rule-feet-natural-chrome", "feet", "natural", "chrome", 75),
  createDurationRule("rule-both-natural-chrome", "both", "natural", "chrome", 120),
  createDurationRule("rule-hands-tip-chrome", "hands", "tip", "chrome", 105),
  createDurationRule("rule-feet-tip-chrome", "feet", "tip", "chrome", 105),
  createDurationRule("rule-both-tip-chrome", "both", "tip", "chrome", 150),
  createDurationRule("rule-hands-builder-chrome", "hands", "builder_gel", "chrome", 135),
  createDurationRule("rule-feet-builder-chrome", "feet", "builder_gel", "chrome", 135),
  createDurationRule("rule-both-builder-chrome", "both", "builder_gel", "chrome", 195),
];

const STAFF_WORKING_SCHEDULES: StaffWorkingSchedule[] = [
  createSchedule("schedule-mia-0", "mia", 0, "09:00", "20:30"),
  createSchedule("schedule-mia-1", "mia", 1, "09:00", "20:30"),
  createSchedule("schedule-mia-2", "mia", 2, "09:00", "20:30", false),
  createSchedule("schedule-mia-3", "mia", 3, "09:00", "20:30"),
  createSchedule("schedule-mia-4", "mia", 4, "09:00", "20:30"),
  createSchedule("schedule-mia-5", "mia", 5, "09:00", "20:30"),
  createSchedule("schedule-mia-6", "mia", 6, "09:00", "20:30"),
  createSchedule("schedule-bella-0", "bella", 0, "09:30", "20:00"),
  createSchedule("schedule-bella-1", "bella", 1, "09:30", "20:00"),
  createSchedule("schedule-bella-2", "bella", 2, "09:30", "20:00"),
  createSchedule("schedule-bella-3", "bella", 3, "09:30", "20:00"),
  createSchedule("schedule-bella-4", "bella", 4, "09:30", "20:00"),
  createSchedule("schedule-bella-5", "bella", 5, "09:30", "20:00"),
  createSchedule("schedule-bella-6", "bella", 6, "09:30", "20:00", false),
  createSchedule("schedule-elena-0", "elena", 0, "10:00", "21:00"),
  createSchedule("schedule-elena-1", "elena", 1, "10:00", "21:00", false),
  createSchedule("schedule-elena-2", "elena", 2, "10:00", "21:00"),
  createSchedule("schedule-elena-3", "elena", 3, "10:00", "21:00"),
  createSchedule("schedule-elena-4", "elena", 4, "10:00", "21:00"),
  createSchedule("schedule-elena-5", "elena", 5, "10:00", "21:00"),
  createSchedule("schedule-elena-6", "elena", 6, "10:00", "21:00"),
];

const MOCK_BLOCK_OFFS: BlockOff[] = [
  createBlockOff(
    "block-mia-lunch",
    "staff",
    "Nghỉ trưa Mia",
    "2026-04-01T12:30:00+07:00",
    "2026-04-01T13:00:00+07:00",
    "mia",
  ),
  createBlockOff(
    "block-bella-training",
    "staff",
    "Đào tạo Bella",
    "2026-04-03T15:00:00+07:00",
    "2026-04-03T16:00:00+07:00",
    "bella",
  ),
  createBlockOff(
    "block-branch-cleaning",
    "branch",
    "Dọn studio",
    "2026-04-08T18:30:00+07:00",
    "2026-04-08T19:00:00+07:00",
  ),
];

type MonthCursor = {
  year: number;
  monthIndex: number;
};

type BaseSlotState = "open" | "booked" | "held" | "past" | "closed";

type StaffDailyAvailability = {
  slotStates: Record<string, BaseSlotState>;
  availableWindowMinutes: Record<string, number>;
};

const SLOT_TIMES = createSlotTimes();

function createStaff(id: string, displayName: string, initials: string): Staff {
  return {
    id,
    displayName,
    initials,
    branchId: null,
    active: true,
    role: "staff",
    createdAt: "2026-03-28T09:00:00+07:00",
    updatedAt: "2026-03-28T09:00:00+07:00",
  };
}

function createDurationRule(
  id: string,
  setType: SetType,
  nailType: NailType,
  polishStyle: PolishStyle,
  baseDurationMinutes: number,
): ServiceDurationRule {
  return {
    id,
    code: id.toUpperCase(),
    branchId: null,
    setType,
    nailType,
    polishStyle,
    effectOption: "any",
    baseDurationMinutes,
    guestCountStrategy: "sequential",
    guestCountMultiplier: 1,
    blockRoundToMinutes: SLOT_INTERVAL_MINUTES,
    active: true,
    notes: "Draft rule aligned to the shared booking foundation.",
    createdAt: "2026-03-28T09:00:00+07:00",
    updatedAt: "2026-03-28T09:00:00+07:00",
  };
}

function createSchedule(
  id: string,
  staffId: string,
  dayOfWeek: StaffWorkingSchedule["dayOfWeek"],
  startTime: string,
  endTime: string,
  isWorkingDay = true,
): StaffWorkingSchedule {
  return {
    id,
    staffId,
    branchId: null,
    dayOfWeek,
    startTime,
    endTime,
    isWorkingDay,
    timezone: "Asia/Bangkok",
    effectiveFrom: null,
    effectiveTo: null,
    createdAt: "2026-03-28T09:00:00+07:00",
    updatedAt: "2026-03-28T09:00:00+07:00",
  };
}

function createBlockOff(
  id: string,
  scope: BlockOff["scope"],
  title: string,
  startAt: string,
  endAt: string,
  staffId?: string,
): BlockOff {
  return {
    id,
    branchId: null,
    staffId: staffId ?? null,
    scope,
    title,
    reason: "Draft block-off for shared availability behavior.",
    startAt,
    endAt,
    active: true,
    createdAt: "2026-03-28T09:00:00+07:00",
    updatedAt: "2026-03-28T09:00:00+07:00",
  };
}

export function getTodayIso(now = new Date()) {
  return formatIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getCurrentTimeLabel(now = new Date()) {
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

export function getMonthCursorFromIso(iso: string) {
  const [year, month] = iso.split("-").map(Number);

  return {
    year,
    monthIndex: month - 1,
  };
}

export function shiftMonthCursor(cursor: MonthCursor, delta: number) {
  const nextDate = new Date(cursor.year, cursor.monthIndex + delta, 1);

  return {
    year: nextDate.getFullYear(),
    monthIndex: nextDate.getMonth(),
  };
}

export function getCalendarMonth(
  cursor: MonthCursor,
  staffId: string,
  serviceSelections: ServiceSelections,
  activeHoldSlot: string | null = null,
) {
  const firstDay = new Date(cursor.year, cursor.monthIndex, 1);
  const firstWeekdayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.year, cursor.monthIndex + 1, 0).getDate();
  const days: CalendarDay[] = [];

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
    const dayAvailability = getDayAvailabilityStatus(
      iso,
      staffId,
      serviceSelections,
      activeHoldSlot,
    );

    days.push({
      key: iso,
      iso,
      dayNumber,
      status: dayAvailability.status,
      disabled: dayAvailability.disabled,
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
    monthLabel: formatMonthLabel(cursor),
    days,
  } satisfies BookingCalendarMonth;
}

export function getSlotAvailabilityForDay(
  iso: string,
  staffId: string,
  serviceSelections: ServiceSelections,
  activeHoldSlot: string | null = null,
) {
  const durationInput = buildDurationInput(serviceSelections, staffId);
  const durationEstimate = estimateDurationDetails(durationInput);
  const targetStaffIds =
    staffId === "any" ? BOOKABLE_STAFF_IDS : [staffId];

  if (targetStaffIds.length === 0) {
    return [];
  }

  const staffMaps = targetStaffIds.map((targetId) =>
    getStaffDailyAvailability(targetId, iso, activeHoldSlot),
  );

  return SLOT_TIMES.map((startTime) => {
    const perStaff = staffMaps.map((availability) => {
      const baseState = availability.slotStates[startTime];
      const freeMinutes = availability.availableWindowMinutes[startTime] ?? 0;

      if (baseState !== "open") {
        return {
          state: mapBaseStateToSlotState(baseState),
          continuousFreeMinutes: 0,
        };
      }

      if (freeMinutes < durationEstimate.blockedDurationMinutes) {
        return {
          state: "insufficient_duration" as const,
          continuousFreeMinutes: freeMinutes,
        };
      }

      return {
        state: "available" as const,
        continuousFreeMinutes: freeMinutes,
      };
    });

    const availableCandidate = perStaff.find((candidate) => candidate.state === "available");
    if (availableCandidate) {
      return {
        startTime,
        endTime: addMinutesToTime(startTime, durationEstimate.blockedDurationMinutes),
        state: "available" as const,
        reason: null,
        continuousFreeMinutes: availableCandidate.continuousFreeMinutes,
        availableStaffIds: targetStaffIds.filter(
          (targetId, index) => perStaff[index].state === "available",
        ),
        holdExpiresAt: null,
      };
    }

    const aggregateState = resolvePoolSlotState(perStaff.map((candidate) => candidate.state));
    const maxFreeMinutes = perStaff.reduce(
      (best, candidate) => Math.max(best, candidate.continuousFreeMinutes),
      0,
    );

    return {
      startTime,
      endTime: addMinutesToTime(startTime, durationEstimate.blockedDurationMinutes),
      state: aggregateState,
      reason:
        aggregateState === "insufficient_duration"
          ? INSUFFICIENT_DURATION_MESSAGE
          : getSlotStateReason(aggregateState),
      continuousFreeMinutes: maxFreeMinutes,
      availableStaffIds: [],
      holdExpiresAt: null,
    };
  });
}

export function getStaffById(staffId: string): StaffOption {
  return STAFF_OPTIONS.find((option) => option.id === staffId) ?? STAFF_OPTIONS[0];
}

export function estimateServiceDuration(selections: ServiceSelections) {
  return estimateDurationDetails(buildDurationInput(selections, "any")).durationMinutes;
}

export function getBlockedDurationMinutes(durationMinutes: number) {
  return roundUpToNearest(durationMinutes, SLOT_INTERVAL_MINUTES);
}

export function getDurationMinutes(
  staffId: string,
  selections: ServiceSelections = DEFAULT_SERVICE_SELECTIONS,
) {
  return estimateDurationDetails(buildDurationInput(selections, staffId)).durationMinutes;
}

export function getDurationEstimate(
  staffId: string,
  selections: ServiceSelections = DEFAULT_SERVICE_SELECTIONS,
  startTime?: string | null,
) {
  return estimateDurationDetails(buildDurationInput(selections, staffId), startTime ?? null);
}

export function buildAvailabilityQuery(
  date: string,
  staffId: string,
  selections: ServiceSelections,
): AvailabilityQuery {
  return {
    date,
    branchId: null,
    requestedStaffId: staffId === "any" ? null : staffId,
    staffAssignmentMode: getStaffAssignmentMode(staffId),
    durationInput: buildDurationInput(selections, staffId),
    slotIntervalMinutes: SLOT_INTERVAL_MINUTES,
    includeAlternativeDates: true,
  };
}

export function buildServiceSummaryLabel(selections: ServiceSelections) {
  const { guestLabel, setLabel, nailLabel, polishLabel, effectLabels } =
    getServiceSelectionPresentation(selections);

  return [guestLabel, setLabel, nailLabel, polishLabel, effectLabels.join(", ")]
    .filter((value) => value && value !== "Không có")
    .join(" · ");
}

export function getServiceSelectionPresentation(selections: ServiceSelections) {
  const normalizedSelections = normalizeServiceSelections(selections);
  const guestLabel = `${normalizedSelections.guestCount} người`;
  const setLabel = SET_COUNT_OPTIONS.find(
    (option) => option.value === normalizedSelections.setType,
  )?.label;
  const nailLabel = NAIL_TYPE_OPTIONS.find(
    (option) => option.value === normalizedSelections.nailType,
  )?.label;
  const polishLabel = POLISH_STYLE_OPTIONS.find(
    (option) => option.value === normalizedSelections.polishStyle,
  )?.label;
  const effectLabels = normalizedSelections.effects
    .filter((effect) => effect !== "none")
    .map(
      (effect) =>
        EFFECT_OPTIONS.find((option) => option.value === effect)?.label ?? effect,
    );

  return {
    guestLabel,
    setLabel: setLabel ?? "Tay",
    nailLabel: nailLabel ?? "Móng thật",
    polishLabel: polishLabel ?? "Sơn trơn gel",
    effectLabels,
  };
}

export function normalizeServiceSelections(
  selections: Partial<ServiceSelections> | null | undefined,
): ServiceSelections {
  const rawSelections = selections as
    | {
        guestCount?: unknown;
        setType?: unknown;
        setCount?: unknown;
        nailType?: unknown;
        polishStyle?: unknown;
        effects?: unknown;
        effect?: unknown;
      }
    | null
    | undefined;
  const guestCount =
    typeof selections?.guestCount === "number" &&
    selections.guestCount >= 1 &&
    selections.guestCount <= 10
      ? selections.guestCount
      : DEFAULT_SERVICE_SELECTIONS.guestCount;

  const setType =
    selections?.setType === "hands" ||
    selections?.setType === "feet" ||
    selections?.setType === "both"
      ? selections.setType
      : rawSelections?.setCount === "hands" ||
          rawSelections?.setCount === "feet" ||
          rawSelections?.setCount === "both"
        ? rawSelections.setCount
        : rawSelections?.setCount === 1
          ? "hands"
          : rawSelections?.setCount === 2
            ? "feet"
            : rawSelections?.setCount === 3
              ? "both"
              : DEFAULT_SERVICE_SELECTIONS.setType;

  const nailType =
    selections?.nailType === "tip" ||
    selections?.nailType === "natural" ||
    selections?.nailType === "builder_gel"
      ? selections.nailType
      : DEFAULT_SERVICE_SELECTIONS.nailType;

  let polishStyle: PolishStyle = DEFAULT_SERVICE_SELECTIONS.polishStyle;
  if (
    selections?.polishStyle === "gel_solid" ||
    selections?.polishStyle === "glitter" ||
    selections?.polishStyle === "cat_eye" ||
    selections?.polishStyle === "chrome"
  ) {
    polishStyle = selections.polishStyle;
  } else if (
    rawSelections?.polishStyle === "regular" ||
    rawSelections?.polishStyle === "gel"
  ) {
    polishStyle = "gel_solid";
  } else if (rawSelections?.polishStyle === "glitter") {
    polishStyle = "glitter";
  } else if (rawSelections?.effect === "chrome") {
    polishStyle = "chrome";
  }

  const rawEffects = Array.isArray(selections?.effects)
    ? selections.effects
    : Array.isArray(rawSelections?.effect)
      ? rawSelections.effect
      : typeof rawSelections?.effect === "string"
        ? [rawSelections.effect]
        : DEFAULT_SERVICE_SELECTIONS.effects;

  const mappedEffects = rawEffects
    .map((effect) => {
      if (effect === "none" || effect === "Không có" || effect === "Không chọn") {
        return "none";
      }

      if (
        effect === "sticker" ||
        effect === "stone" ||
        effect === "Đính đá / Sticker" ||
        effect === "Đính đá nhẹ"
      ) {
        return "sticker";
      }

      if (
        effect === "design" ||
        effect === "art" ||
        effect === "Vẽ design" ||
        effect === "Vẽ đơn giản"
      ) {
        return "design";
      }

      return null;
    })
    .filter((effect): effect is EffectOption => effect !== null);

  const normalizedEffects =
    mappedEffects.length === 0 || mappedEffects.includes("none")
      ? (["none"] as EffectOption[])
      : (Array.from(
          new Set(mappedEffects.filter((effect) => effect !== "none")),
        ) as EffectOption[]);

  return {
    guestCount,
    setType,
    nailType,
    polishStyle,
    effects: normalizedEffects,
  };
}

export function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const normalizedHours = Math.floor(totalMinutes / 60);
  const normalizedMinutes = totalMinutes % 60;

  return `${String(normalizedHours).padStart(2, "0")}:${String(
    normalizedMinutes,
  ).padStart(2, "0")}`;
}

export function formatDateLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Date(`${iso}T12:00:00`).getDay();
  const weekdayLabel =
    weekday === 0 ? "Chủ nhật" : `Thứ ${weekday === 1 ? "hai" : weekday + 1}`;

  return `${weekdayLabel}, ${day} thg ${month} ${year}`;
}

export function isSlotSelectable(
  iso: string,
  time: string,
  staffId: string,
  selections: ServiceSelections,
  activeHoldSlot: string | null = null,
) {
  return getSlotAvailabilityForDay(iso, staffId, selections, activeHoldSlot).some(
    (slot) => slot.startTime === time && slot.state === "available",
  );
}

export function readStoredJson<T>(storageKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

export function notifyBookingStorageUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(BOOKING_STORAGE_UPDATED_EVENT));
}

export function notifyGuestStorageUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(GUEST_STORAGE_UPDATED_EVENT));
}

export function normalizeVietnamesePhone(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  let normalized = digitsOnly;

  if (normalized.startsWith("84")) {
    normalized = `0${normalized.slice(2)}`;
  }

  if (!normalized.startsWith("0") && normalized.length === 9) {
    normalized = `0${normalized}`;
  }

  return normalized.slice(0, 10);
}

export function toVietnamE164(value: string) {
  const normalized = normalizeVietnamesePhone(value);

  if (!normalized) {
    return "";
  }

  return `+84${normalized.slice(1)}`;
}

export function formatVietnamesePhone(value: string) {
  const normalized = normalizeVietnamesePhone(value);

  if (normalized.length <= 4) {
    return normalized;
  }

  if (normalized.length <= 7) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4)}`;
  }

  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
}

export function isHoldActive(
  draft: Pick<PersistedBookingDraft, "holdSlot" | "holdExpiresAt" | "startTime">,
  nowTs = Date.now(),
) {
  return Boolean(
    draft.holdSlot &&
      draft.startTime &&
      draft.holdSlot === draft.startTime &&
      draft.holdExpiresAt &&
      draft.holdExpiresAt > nowTs,
  );
}

export function getHoldRemainingMs(
  draft: Pick<PersistedBookingDraft, "holdSlot" | "holdExpiresAt" | "startTime">,
  nowTs = Date.now(),
) {
  if (!isHoldActive(draft, nowTs) || !draft.holdExpiresAt) {
    return 0;
  }

  return Math.max(0, draft.holdExpiresAt - nowTs);
}

export function formatHoldCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getNearbyAlternativeSlots(
  iso: string,
  selectedTime: string,
  staffId: string,
  serviceSelections: ServiceSelections,
  count = 2,
) {
  const selectedMinutes = convertTimeToMinutes(selectedTime);

  return getSlotAvailabilityForDay(iso, staffId, serviceSelections)
    .filter((slot) => slot.state === "available" && slot.startTime !== selectedTime)
    .sort((left, right) => {
      return (
        Math.abs(convertTimeToMinutes(left.startTime) - selectedMinutes) -
        Math.abs(convertTimeToMinutes(right.startTime) - selectedMinutes)
      );
    })
    .slice(0, count)
    .map((slot) => slot.startTime);
}

export function simulateFinalAvailabilityCheck(
  bookingDraft: PersistedBookingDraft,
  guestDraft: PersistedGuestDetailsDraft,
  nowTs = Date.now(),
) {
  const serviceSelections = normalizeServiceSelections(
    bookingDraft.serviceSelections ?? DEFAULT_SERVICE_SELECTIONS,
  );
  const alternativeSlots =
    bookingDraft.date && bookingDraft.startTime
      ? getNearbyAlternativeSlots(
          bookingDraft.date,
          bookingDraft.startTime,
          bookingDraft.staffId,
          serviceSelections,
        )
      : [];

  if (!isHoldActive(bookingDraft, nowTs)) {
    return {
      success: false,
      message:
        "Khung giờ bạn giữ tạm đã hết hạn. Vui lòng chọn lại một khung giờ còn trống.",
      alternativeSlots,
    };
  }

  const recheckSeed = Number(
    `${bookingDraft.date?.replaceAll("-", "") ?? "20260401"}${
      bookingDraft.startTime?.replace(":", "") ?? "0900"
    }${guestDraft.normalizedPhone.slice(-2).padStart(2, "0")}`,
  );

  if (recheckSeed % 7 === 0) {
    return {
      success: false,
      message:
        "Khung giờ này vừa không còn khả dụng. Bạn có thể quay lại để chọn một khung giờ gần nhất.",
      alternativeSlots,
    };
  }

  return {
    success: true,
    message: "",
    alternativeSlots: [],
  };
}

export function getOccupiedSlotTimes(
  startTime: string | null,
  blockedDurationMinutes: number,
) {
  if (!startTime || blockedDurationMinutes <= 0) {
    return [];
  }

  const occupiedTimes: string[] = [];
  const slotCount = Math.ceil(blockedDurationMinutes / SLOT_INTERVAL_MINUTES);
  const startMinutes = convertTimeToMinutes(startTime);

  for (let index = 0; index < slotCount; index += 1) {
    occupiedTimes.push(
      convertMinutesToTime(startMinutes + index * SLOT_INTERVAL_MINUTES),
    );
  }

  return occupiedTimes;
}

function createSlotTimes() {
  const times: string[] = [];

  for (
    let minutes = SALON_OPEN_MINUTES;
    minutes <= SALON_CLOSE_MINUTES - SLOT_INTERVAL_MINUTES;
    minutes += SLOT_INTERVAL_MINUTES
  ) {
    times.push(convertMinutesToTime(minutes));
  }

  return times;
}

function getDayAvailabilityStatus(
  iso: string,
  staffId: string,
  selections: ServiceSelections,
  activeHoldSlot: string | null,
) {
  const todayIso = getTodayIso();
  const isPastDay = iso < todayIso;

  if (isPastDay) {
    return {
      status: "closed" as const,
      disabled: true,
    };
  }

  const slots = getSlotAvailabilityForDay(iso, staffId, selections, activeHoldSlot);
  const availableCount = slots.filter((slot) => slot.state === "available").length;
  const allClosed = slots.every(
    (slot) => slot.state === "closed" || slot.state === "past",
  );

  if (allClosed || availableCount === 0) {
    return {
      status: "closed" as const,
      disabled: true,
    };
  }

  return {
    status: availableCount <= 5 ? ("limited" as const) : ("available" as const),
    disabled: isPastDay,
  };
}

function getStaffDailyAvailability(
  staffId: string,
  iso: string,
  activeHoldSlot: string | null,
) {
  const schedule = getScheduleForDate(staffId, iso);
  const todayIso = getTodayIso();
  const currentTimeMinutes = convertTimeToMinutes(getCurrentTimeLabel());
  const isPastDay = iso < todayIso;
  const slotStates: Record<string, BaseSlotState> = {};
  const availableWindowMinutes: Record<string, number> = {};

  for (const time of SLOT_TIMES) {
    const timeMinutes = convertTimeToMinutes(time);

    if (
      !schedule ||
      !schedule.isWorkingDay ||
      timeMinutes < convertTimeToMinutes(schedule.startTime) ||
      timeMinutes >= convertTimeToMinutes(schedule.endTime)
    ) {
      slotStates[time] = "closed";
      continue;
    }

    if (isPastDay || (iso === todayIso && timeMinutes < currentTimeMinutes)) {
      slotStates[time] = "past";
      continue;
    }

    if (
      activeHoldSlot &&
      time === activeHoldSlot &&
      iso >= todayIso
    ) {
      slotStates[time] = "open";
      continue;
    }

    if (isBlockedOff(staffId, iso, time)) {
      slotStates[time] = "closed";
      continue;
    }

    if (isHeldByAnotherClient(staffId, iso, time)) {
      slotStates[time] = "held";
      continue;
    }

    if (isBookedByExistingAppointment(staffId, iso, time)) {
      slotStates[time] = "booked";
      continue;
    }

    slotStates[time] = "open";
  }

  for (let index = 0; index < SLOT_TIMES.length; index += 1) {
    const time = SLOT_TIMES[index];

    if (slotStates[time] !== "open") {
      availableWindowMinutes[time] = 0;
      continue;
    }

    let freeMinutes = 0;

    for (let nextIndex = index; nextIndex < SLOT_TIMES.length; nextIndex += 1) {
      const nextTime = SLOT_TIMES[nextIndex];

      if (slotStates[nextTime] !== "open") {
        break;
      }

      freeMinutes += SLOT_INTERVAL_MINUTES;
    }

    availableWindowMinutes[time] = freeMinutes;
  }

  return {
    slotStates,
    availableWindowMinutes,
  } satisfies StaffDailyAvailability;
}

function getScheduleForDate(staffId: string, iso: string) {
  const weekday = new Date(`${iso}T12:00:00`).getDay() as StaffWorkingSchedule["dayOfWeek"];

  return STAFF_WORKING_SCHEDULES.find(
    (schedule) => schedule.staffId === staffId && schedule.dayOfWeek === weekday,
  );
}

function isBlockedOff(staffId: string, iso: string, time: string) {
  const slotMinutes = convertTimeToMinutes(time);

  return MOCK_BLOCK_OFFS.some((block) => {
    const start = new Date(block.startAt);
    const end = new Date(block.endAt);
    const blockIso = formatIsoDate(start.getFullYear(), start.getMonth(), start.getDate());
    const appliesToStaff =
      block.scope === "branch" ||
      block.scope === "global" ||
      block.staffId === staffId;

    return (
      block.active &&
      appliesToStaff &&
      blockIso === iso &&
      slotMinutes >= start.getHours() * 60 + start.getMinutes() &&
      slotMinutes < end.getHours() * 60 + end.getMinutes()
    );
  });
}

function isHeldByAnotherClient(staffId: string, iso: string, time: string) {
  const intervals = getHeldIntervals(staffId, iso);

  return intervals.some((interval) => isTimeInsideInterval(time, interval));
}

function isBookedByExistingAppointment(staffId: string, iso: string, time: string) {
  return getMockStoredBookings(staffId, iso).some((booking) =>
    isTimeInsideInterval(time, {
      startMinutes: convertTimeToMinutes(booking.startTime),
      endMinutes: convertTimeToMinutes(booking.estimatedEndTime),
    }),
  );
}

function getHeldIntervals(staffId: string, iso: string) {
  const seed = createSeed(`${iso}-${staffId}-held`);
  const startIndex = 5 + (seed % 10);
  const shouldCreateHold = seed % 8 === 0;

  if (!shouldCreateHold) {
    return [];
  }

  return [
    {
      startMinutes: SALON_OPEN_MINUTES + startIndex * SLOT_INTERVAL_MINUTES,
      endMinutes:
        SALON_OPEN_MINUTES + (startIndex + 1) * SLOT_INTERVAL_MINUTES,
    },
  ];
}

function getMockStoredBookings(staffId: string, iso: string) {
  const seed = createSeed(`${iso}-${staffId}-booked`);
  const intervals: { startMinutes: number; durationMinutes: number }[] = [];

  if (seed % 3 === 0) {
    intervals.push({
      startMinutes: SALON_OPEN_MINUTES + (2 + (seed % 4)) * SLOT_INTERVAL_MINUTES,
      durationMinutes: (1 + (seed % 2)) * SLOT_INTERVAL_MINUTES,
    });
  }

  if (seed % 5 === 0) {
    intervals.push({
      startMinutes: SALON_OPEN_MINUTES + (9 + (seed % 5)) * SLOT_INTERVAL_MINUTES,
      durationMinutes: (2 + (seed % 2)) * SLOT_INTERVAL_MINUTES,
    });
  }

  if (seed % 11 === 0) {
    intervals.push({
      startMinutes: SALON_OPEN_MINUTES + (15 + (seed % 3)) * SLOT_INTERVAL_MINUTES,
      durationMinutes: SLOT_INTERVAL_MINUTES,
    });
  }

  return intervals.map((interval, index) =>
    createMockStoredBooking(staffId, iso, interval.startMinutes, interval.durationMinutes, index),
  );
}

function createMockStoredBooking(
  staffId: string,
  iso: string,
  startMinutes: number,
  durationMinutes: number,
  index: number,
): Booking {
  const startTime = convertMinutesToTime(startMinutes);
  const estimatedEndTime = convertMinutesToTime(startMinutes + durationMinutes);

  return {
    id: `mock-booking-${staffId}-${iso}-${index}`,
    referenceCode: `MOCK-${iso.replaceAll("-", "")}-${index}`,
    customerId: null,
    customerSnapshot: {
      fullName: "Mock Customer",
      phoneE164: "+84900000000",
    },
    anonymousSessionId: null,
    branchId: null,
    date: iso,
    startTime,
    estimatedEndTime,
    durationMinutes,
    guestCount: 1,
    setType: "hands",
    nailType: "natural",
    polishStyle: "gel_solid",
    effects: ["none"],
    notes: "Mock stored booking for availability simulation.",
    source: "website",
    channel: "web_self_booking",
    status: index % 2 === 0 ? "confirmed" : "checked_in",
    assignedStaffMode: "specific_staff",
    assignedStaffId: staffId,
    timestamps: {
      createdAt: `${iso}T08:00:00+07:00`,
      updatedAt: `${iso}T08:00:00+07:00`,
      confirmedAt: `${iso}T08:05:00+07:00`,
      checkedInAt: index % 2 === 0 ? null : `${iso}T${startTime}:00+07:00`,
      actualCompletedAt: null,
      cancelledAt: null,
    },
    auditMetadata: {
      createdByActorType: "system",
      createdByActorId: "mock-seed",
      updatedByActorType: "system",
      updatedByActorId: "mock-seed",
    },
  };
}

function buildDurationInput(
  selections: ServiceSelections,
  staffId: string,
): DurationInput {
  const normalizedSelections = normalizeServiceSelections(selections);

  return {
    guestCount: normalizedSelections.guestCount,
    setType: normalizedSelections.setType,
    nailType: normalizedSelections.nailType,
    polishStyle: normalizedSelections.polishStyle,
    effects: normalizedSelections.effects,
    branchId: null,
    requestedStaffId: staffId === "any" ? null : staffId,
    staffAssignmentMode: getStaffAssignmentMode(staffId),
    processingStrategy: "sequential",
  };
}

function estimateDurationDetails(
  input: DurationInput,
  startTime: string | null = null,
): DurationEstimate {
  const normalizedEffects = input.effects.includes("none") ? [] : input.effects;
  const matchedRule = MOCK_SERVICE_DURATION_RULES.find(
    (rule) =>
      rule.setType === input.setType &&
      rule.nailType === input.nailType &&
      rule.polishStyle === input.polishStyle &&
      rule.active,
  );

  const baseDurationMinutes = matchedRule?.baseDurationMinutes ?? 60;
  const effectMinutes = normalizedEffects.reduce((total, effect) => {
    return total + (effect === "none" ? 0 : EFFECT_EXTRA_MINUTES[effect] ?? 0);
  }, 0);
  const durationMinutes = roundUpToNearest(
    (baseDurationMinutes + effectMinutes) * input.guestCount,
    SLOT_INTERVAL_MINUTES,
  );

  return {
    durationMinutes,
    blockedDurationMinutes: durationMinutes,
    slotIntervalMinutes: SLOT_INTERVAL_MINUTES,
    estimatedEndTime: startTime ? addMinutesToTime(startTime, durationMinutes) : null,
    matchedRuleCodes: matchedRule ? [matchedRule.code] : ["draft-fallback-rule"],
    notes: [
      "Draft duration estimate from shared service duration rules.",
      input.processingStrategy === "parallel"
        ? "Parallel guest processing is TBD and not implemented in the mock yet."
        : "Guest count currently scales sequentially in the mock.",
    ],
  };
}

function getStaffAssignmentMode(staffId: string): StaffAssignmentMode {
  return staffId === "any" ? "pool" : "specific_staff";
}

function isTimeInsideInterval(
  time: string,
  interval: { startMinutes: number; endMinutes: number },
) {
  const timeMinutes = convertTimeToMinutes(time);

  return (
    timeMinutes >= interval.startMinutes && timeMinutes < interval.endMinutes
  );
}

function mapBaseStateToSlotState(baseState: BaseSlotState): Exclude<SlotState, "insufficient_duration"> {
  switch (baseState) {
    case "booked":
      return "booked";
    case "held":
      return "held";
    case "past":
      return "past";
    case "closed":
      return "closed";
    default:
      return "available";
  }
}

function resolvePoolSlotState(states: SlotState[]) {
  if (states.every((state) => state === "past")) {
    return "past" as const;
  }

  if (states.every((state) => state === "closed")) {
    return "closed" as const;
  }

  if (states.some((state) => state === "held")) {
    return "held" as const;
  }

  if (states.some((state) => state === "insufficient_duration")) {
    return "insufficient_duration" as const;
  }

  if (states.some((state) => state === "booked")) {
    return "booked" as const;
  }

  return states[0] ?? "closed";
}

function getSlotStateReason(state: SlotState) {
  switch (state) {
    case "booked":
      return "Khung giờ này đã được đặt trước.";
    case "held":
      return "Khung giờ này đang được giữ tạm.";
    case "past":
      return "Khung giờ này đã qua.";
    case "closed":
      return "Khung giờ này nằm ngoài thời gian làm việc.";
    case "insufficient_duration":
      return INSUFFICIENT_DURATION_MESSAGE;
    default:
      return null;
  }
}

function createSeed(value: string) {
  return value.split("").reduce((accumulator, currentChar) => {
    return accumulator + currentChar.charCodeAt(0);
  }, 0);
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

function roundUpToNearest(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

function formatIsoDate(year: number, monthIndex: number, dayNumber: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(
    dayNumber,
  ).padStart(2, "0")}`;
}

function formatMonthLabel(cursor: MonthCursor) {
  return `Tháng ${cursor.monthIndex + 1} ${cursor.year}`;
}
