export type DayStatus = "available" | "limited" | "closed";
export type SlotState =
  | "available"
  | "booked"
  | "held"
  | "past"
  | "closed"
  | "insufficient_duration";

export type SetArea = "hands" | "feet" | "both";
export type NailType = "natural" | "tip";
export type PolishStyle = "gel_solid" | "cat_eye" | "chrome";
export type EffectOption = "none" | "sticker" | "design";

export type ServiceSelections = {
  guestCount: number;
  setCount: SetArea;
  nailType: NailType;
  polishStyle: PolishStyle;
  effect: EffectOption[];
};

export type StaffOption = {
  id: string;
  name: string;
  initials: string;
  durationMinutes: number;
};

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

export type SlotOption = {
  time: string;
  state: SlotState;
  reason: string | null;
  continuousFreeMinutes: number;
};

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
  endTime: string | null;
  slotIntervalMinutes: number;
  holdSlot: string | null;
  holdExpiresAt: number | null;
  status: "draft" | "pending";
  latestNotice: BookingFlowNotice | null;
  serviceSelections?: ServiceSelections;
  serviceLabel?: string;
  blockedDurationMinutes?: number;
  availabilityMode?: "pool" | "artist";
};

export type PersistedGuestDetailsDraft = {
  fullName: string;
  phone: string;
  normalizedPhone: string;
  guestCount: string;
  setCount: string;
  nailType: string;
  polishStyle: string;
  effect: string;
  note: string;
  serviceLabel: string;
};

export const BOOKING_STORAGE_KEY = "nail-booking-draft";
export const GUEST_DETAILS_STORAGE_KEY = "nail-guest-details";
export const BOOKING_STORAGE_UPDATED_EVENT = "booking-storage-updated";
export const GUEST_STORAGE_UPDATED_EVENT = "guest-storage-updated";
export const MOCK_TODAY_ISO = "2026-04-01";
export const MOCK_CURRENT_TIME = "11:30";
export const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const TEMP_HOLD_DURATION_MS = 5 * 60 * 1000;
export const SLOT_INTERVAL_MINUTES = 30;
export const SALON_OPEN_MINUTES = 9 * 60;
export const SALON_CLOSE_MINUTES = 21 * 60;
export const INSUFFICIENT_DURATION_MESSAGE =
  "Vui lòng điều chỉnh dịch vụ để vừa khoảng thời gian còn trống.";

export const DEFAULT_SERVICE_SELECTIONS: ServiceSelections = {
  guestCount: 1,
  setCount: "hands",
  nailType: "natural",
  polishStyle: "gel_solid",
  effect: ["none"],
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
] as const;

export const POLISH_STYLE_OPTIONS = [
  { value: "gel_solid", label: "Sơn trơn gel" },
  { value: "cat_eye", label: "Mắt mèo" },
  { value: "chrome", label: "Tráng gương" },
] as const;

export const EFFECT_OPTIONS = [
  { value: "none", label: "Không có" },
  { value: "sticker", label: "Đính đá / Sticker" },
  { value: "design", label: "Vẽ design" },
] as const;

export const STAFF_OPTIONS: StaffOption[] = [
  {
    id: "any",
    name: "Bất kỳ thợ nào",
    initials: "☆",
    durationMinutes: 0,
  },
  {
    id: "mia",
    name: "Mia",
    initials: "MI",
    durationMinutes: 0,
  },
  {
    id: "bella",
    name: "Bella",
    initials: "BE",
    durationMinutes: 0,
  },
  {
    id: "elena",
    name: "Elena",
    initials: "EL",
    durationMinutes: 0,
  },
];

const BOOKABLE_STAFF_IDS = STAFF_OPTIONS.filter((option) => option.id !== "any").map(
  (option) => option.id,
);

const EFFECT_EXTRA_MINUTES: Record<Exclude<EffectOption, "none">, number> = {
  sticker: 15,
  design: 30,
};

const BASE_DURATION_TABLE: Record<
  NailType,
  Record<PolishStyle, number>
> = {
  natural: {
    gel_solid: 60,
    cat_eye: 75,
    chrome: 75,
  },
  tip: {
    gel_solid: 90,
    cat_eye: 105,
    chrome: 105,
  },
};

const STAFF_SCHEDULES = {
  mia: {
    offWeekdays: [2],
    startMinutes: 9 * 60,
    endMinutes: 20 * 60 + 30,
  },
  bella: {
    offWeekdays: [5],
    startMinutes: 9 * 60 + 30,
    endMinutes: 20 * 60,
  },
  elena: {
    offWeekdays: [0],
    startMinutes: 10 * 60,
    endMinutes: 21 * 60,
  },
} as const;

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
  const durationMinutes = estimateServiceDuration(serviceSelections);
  const blockedDurationMinutes = getBlockedDurationMinutes(durationMinutes);
  const targetStaffIds =
    staffId === "any" ? BOOKABLE_STAFF_IDS : [staffId];

  if (targetStaffIds.length === 0) {
    return [];
  }

  const staffMaps = targetStaffIds.map((targetId) =>
    getStaffDailyAvailability(targetId, iso, activeHoldSlot),
  );

  return SLOT_TIMES.map((time) => {
    const perStaff = staffMaps.map((availability) => {
      const baseState = availability.slotStates[time];
      const freeMinutes = availability.availableWindowMinutes[time] ?? 0;

      if (baseState !== "open") {
        return {
          state: mapBaseStateToSlotState(baseState),
          continuousFreeMinutes: 0,
        };
      }

      if (freeMinutes < blockedDurationMinutes) {
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
        time,
        state: "available" as const,
        reason: null,
        continuousFreeMinutes: availableCandidate.continuousFreeMinutes,
      };
    }

    const aggregateState = resolvePoolSlotState(perStaff.map((candidate) => candidate.state));
    const maxFreeMinutes = perStaff.reduce(
      (best, candidate) => Math.max(best, candidate.continuousFreeMinutes),
      0,
    );

    return {
      time,
      state: aggregateState,
      reason:
        aggregateState === "insufficient_duration"
          ? INSUFFICIENT_DURATION_MESSAGE
          : getSlotStateReason(aggregateState),
      continuousFreeMinutes: maxFreeMinutes,
    };
  });
}

export function getStaffById(staffId: string): StaffOption {
  return STAFF_OPTIONS.find((option) => option.id === staffId) ?? STAFF_OPTIONS[0];
}

export function estimateServiceDuration(selections: ServiceSelections) {
  const normalizedSelections = normalizeServiceSelections(selections);
  const basePerSet =
    BASE_DURATION_TABLE[normalizedSelections.nailType][normalizedSelections.polishStyle];
  const setMultiplier = normalizedSelections.setCount === "both" ? 2 : 1;
  const effectMinutesPerSet = normalizedSelections.effect.includes("none")
    ? 0
    : normalizedSelections.effect.reduce((total, effect) => {
        if (effect === "none") {
          return total;
        }

        return total + EFFECT_EXTRA_MINUTES[effect];
      }, 0);
  const estimatedMinutes =
    normalizedSelections.guestCount *
    setMultiplier *
    (basePerSet + effectMinutesPerSet);

  return roundUpToNearest(estimatedMinutes, SLOT_INTERVAL_MINUTES);
}

export function getBlockedDurationMinutes(durationMinutes: number) {
  return roundUpToNearest(durationMinutes, SLOT_INTERVAL_MINUTES);
}

export function getDurationMinutes(
  staffId: string,
  selections: ServiceSelections = DEFAULT_SERVICE_SELECTIONS,
) {
  const estimatedDuration = estimateServiceDuration(selections);

  if (staffId === "any") {
    return estimatedDuration;
  }

  return estimatedDuration;
}

export function buildServiceSummaryLabel(selections: ServiceSelections) {
  const normalizedSelections = normalizeServiceSelections(selections);
  const guestLabel = `${normalizedSelections.guestCount} người`;
  const setLabel = SET_COUNT_OPTIONS.find(
    (option) => option.value === normalizedSelections.setCount,
  )?.label;
  const nailLabel = NAIL_TYPE_OPTIONS.find(
    (option) => option.value === normalizedSelections.nailType,
  )?.label;
  const polishLabel = POLISH_STYLE_OPTIONS.find(
    (option) => option.value === normalizedSelections.polishStyle,
  )?.label;
  const effectLabels = normalizedSelections.effect
    .filter((effect) => effect !== "none")
    .map(
      (effect) =>
        EFFECT_OPTIONS.find((option) => option.value === effect)?.label ?? effect,
    );

  return [guestLabel, setLabel, nailLabel, polishLabel, effectLabels.join(", ")]
    .filter((value) => value && value !== "Không có")
    .join(" · ");
}

export function normalizeServiceSelections(
  selections: Partial<ServiceSelections> | null | undefined,
): ServiceSelections {
  const rawSelections = selections as
    | {
        guestCount?: unknown;
        setCount?: unknown;
        nailType?: unknown;
        polishStyle?: unknown;
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

  const setCount =
    selections?.setCount === "hands" ||
    selections?.setCount === "feet" ||
    selections?.setCount === "both"
      ? selections.setCount
      : rawSelections?.setCount === 1
        ? "hands"
        : rawSelections?.setCount === 2
          ? "feet"
          : rawSelections?.setCount === 3
            ? "both"
            : DEFAULT_SERVICE_SELECTIONS.setCount;

  const nailType =
    selections?.nailType === "tip" || selections?.nailType === "natural"
      ? selections.nailType
      : DEFAULT_SERVICE_SELECTIONS.nailType;

  let polishStyle: PolishStyle = DEFAULT_SERVICE_SELECTIONS.polishStyle;
  if (
    selections?.polishStyle === "gel_solid" ||
    selections?.polishStyle === "cat_eye" ||
    selections?.polishStyle === "chrome"
  ) {
    polishStyle = selections.polishStyle;
  } else if (
    rawSelections?.polishStyle === "regular" ||
    rawSelections?.polishStyle === "gel"
  ) {
    polishStyle = "gel_solid";
  } else if (rawSelections?.effect === "chrome") {
    polishStyle = "chrome";
  }

  const rawEffects = Array.isArray(selections?.effect)
    ? selections.effect
    : typeof rawSelections?.effect === "string"
      ? [rawSelections.effect]
      : DEFAULT_SERVICE_SELECTIONS.effect;

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
    setCount,
    nailType,
    polishStyle,
    effect: normalizedEffects,
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
    (slot) => slot.time === time && slot.state === "available",
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
    .filter((slot) => slot.state === "available" && slot.time !== selectedTime)
    .sort((left, right) => {
      return (
        Math.abs(convertTimeToMinutes(left.time) - selectedMinutes) -
        Math.abs(convertTimeToMinutes(right.time) - selectedMinutes)
      );
    })
    .slice(0, count)
    .map((slot) => slot.time);
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
  const slots = getSlotAvailabilityForDay(iso, staffId, selections, activeHoldSlot);
  const availableCount = slots.filter((slot) => slot.state === "available").length;
  const allClosed = slots.every(
    (slot) => slot.state === "closed" || slot.state === "past",
  );
  const isPastDay = iso < MOCK_TODAY_ISO;

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
  const schedule = STAFF_SCHEDULES[staffId as keyof typeof STAFF_SCHEDULES];
  const date = new Date(`${iso}T12:00:00`);
  const weekday = date.getDay();
  const isPastDay = iso < MOCK_TODAY_ISO;
  const currentTimeMinutes = convertTimeToMinutes(MOCK_CURRENT_TIME);
  const slotStates: Record<string, BaseSlotState> = {};
  const availableWindowMinutes: Record<string, number> = {};

  for (const time of SLOT_TIMES) {
    const timeMinutes = convertTimeToMinutes(time);

    if (
      schedule.offWeekdays.includes(weekday as never) ||
      timeMinutes < schedule.startMinutes ||
      timeMinutes >= schedule.endMinutes
    ) {
      slotStates[time] = "closed";
      continue;
    }

    if (isPastDay || (iso === MOCK_TODAY_ISO && timeMinutes < currentTimeMinutes)) {
      slotStates[time] = "past";
      continue;
    }

    if (
      activeHoldSlot &&
      time === activeHoldSlot &&
      iso >= MOCK_TODAY_ISO
    ) {
      slotStates[time] = "open";
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

function isHeldByAnotherClient(staffId: string, iso: string, time: string) {
  const intervals = getHeldIntervals(staffId, iso);

  return intervals.some((interval) => isTimeInsideInterval(time, interval));
}

function isBookedByExistingAppointment(staffId: string, iso: string, time: string) {
  const intervals = getBookedIntervals(staffId, iso);

  return intervals.some((interval) => isTimeInsideInterval(time, interval));
}

function getHeldIntervals(staffId: string, iso: string) {
  const seed = createSeed(`${iso}-${staffId}-held`);
  const startIndex = 6 + (seed % 8);
  const shouldCreateHold = seed % 3 === 0;

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

function getBookedIntervals(staffId: string, iso: string) {
  const seed = createSeed(`${iso}-${staffId}-booked`);
  const morningStart = 1 + (seed % 5);
  const middayStart = 8 + (seed % 6);
  const eveningStart = 14 + (seed % 4);

  return [
    {
      startMinutes: SALON_OPEN_MINUTES + morningStart * SLOT_INTERVAL_MINUTES,
      endMinutes:
        SALON_OPEN_MINUTES +
        (morningStart + 1 + (seed % 2)) * SLOT_INTERVAL_MINUTES,
    },
    {
      startMinutes: SALON_OPEN_MINUTES + middayStart * SLOT_INTERVAL_MINUTES,
      endMinutes:
        SALON_OPEN_MINUTES +
        (middayStart + 2 + (seed % 2)) * SLOT_INTERVAL_MINUTES,
    },
    ...(seed % 2 === 0
      ? [
          {
            startMinutes:
              SALON_OPEN_MINUTES + eveningStart * SLOT_INTERVAL_MINUTES,
            endMinutes:
              SALON_OPEN_MINUTES +
              (eveningStart + 1) * SLOT_INTERVAL_MINUTES,
          },
        ]
      : []),
  ];
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
