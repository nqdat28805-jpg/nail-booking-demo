import type { TemporaryHold } from "@/src/domain/availability/types";
import type {
  Booking,
  NailType,
  PolishStyle,
  SetType,
} from "@/src/domain/booking/types";
import type { ServiceDurationRule } from "@/src/domain/config/types";
import type { BlockOff, Staff, StaffWorkingSchedule } from "@/src/domain/staff/types";

const SLOT_INTERVAL_MINUTES = 30;
const SALON_OPEN_MINUTES = 9 * 60;

export const DEMO_BRANCH_ID = "19nail-main";

export const DEMO_STAFF: Staff[] = [
  createStaff("mia", "Yến", "YẾ", 1),
  createStaff("bella", "Linh", "LI", 2),
  createStaff("elena", "Nga", "NG", 3),
];

export const DEMO_STAFF_SCHEDULES: StaffWorkingSchedule[] = [
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

export const DEMO_BLOCK_OFFS: BlockOff[] = [
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

const BASE_DURATION_MATRIX: Record<
  NailType,
  Record<PolishStyle, Record<SetType, number>>
> = {
  natural: {
    gel_solid: { hands: 45, feet: 45, both: 90 },
    glitter: { hands: 60, feet: 60, both: 120 },
    cat_eye: { hands: 75, feet: 75, both: 120 },
    chrome: { hands: 75, feet: 75, both: 120 },
  },
  tip: {
    gel_solid: { hands: 60, feet: 60, both: 120 },
    glitter: { hands: 90, feet: 90, both: 150 },
    cat_eye: { hands: 105, feet: 105, both: 150 },
    chrome: { hands: 105, feet: 105, both: 150 },
  },
  builder_gel: {
    gel_solid: { hands: 90, feet: 90, both: 150 },
    glitter: { hands: 120, feet: 120, both: 180 },
    cat_eye: { hands: 135, feet: 135, both: 195 },
    chrome: { hands: 135, feet: 135, both: 195 },
  },
};

export const DEMO_DURATION_RULES: ServiceDurationRule[] = (
  Object.entries(BASE_DURATION_MATRIX) as Array<
    [NailType, Record<PolishStyle, Record<SetType, number>>]
  >
).flatMap(([nailType, polishStyles]) =>
  (Object.entries(polishStyles) as Array<
    [PolishStyle, Record<SetType, number>]
  >).flatMap(([polishStyle, setTypes]) =>
    (Object.entries(setTypes) as Array<[SetType, number]>).map(
      ([setType, minutes]) =>
        createDurationRule(
          `rule-${setType}-${nailType}-${polishStyle}`,
          setType,
          nailType,
          polishStyle,
          minutes,
        ),
    ),
  ),
);

export function getDemoSeededBookings(staffId: string, iso: string) {
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
    createMockStoredBooking(
      staffId,
      iso,
      interval.startMinutes,
      interval.durationMinutes,
      index,
    ),
  );
}

export function getDemoSeededTemporaryHolds(
  staffId: string,
  iso: string,
): TemporaryHold[] {
  const seed = createSeed(`${iso}-${staffId}-held`);
  const startIndex = 5 + (seed % 10);
  const shouldCreateHold = seed % 8 === 0;

  if (!shouldCreateHold) {
    return [];
  }

  const startMinutes = SALON_OPEN_MINUTES + startIndex * SLOT_INTERVAL_MINUTES;
  const endMinutes = startMinutes + SLOT_INTERVAL_MINUTES;

  return [
    {
      id: `mock-hold-${staffId}-${iso}`,
      branchId: DEMO_BRANCH_ID,
      date: iso,
      startTime: convertMinutesToTime(startMinutes),
      endTime: convertMinutesToTime(endMinutes),
      staffId,
      assignedStaffMode: "specific_staff",
      durationMinutes: SLOT_INTERVAL_MINUTES,
      createdBySessionId: `seed-${staffId}`,
      expiresAt: `${iso}T${convertMinutesToTime(endMinutes)}:00+07:00`,
      status: "active",
      createdAt: `${iso}T08:00:00+07:00`,
      updatedAt: `${iso}T08:00:00+07:00`,
    },
  ];
}

function createStaff(
  id: string,
  displayName: string,
  initials: string,
  sortOrder: number,
): Staff {
  return {
    id,
    displayName,
    initials,
    branchId: DEMO_BRANCH_ID,
    active: true,
    sortOrder,
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
    branchId: DEMO_BRANCH_ID,
    setType,
    nailType,
    polishStyle,
    effectOption: "any",
    baseDurationMinutes,
    guestCountStrategy: "sequential",
    guestCountMultiplier: 1,
    blockRoundToMinutes: SLOT_INTERVAL_MINUTES,
    active: true,
    notes: "Seeded demo rule for shared booking runtime.",
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
    branchId: DEMO_BRANCH_ID,
    dayOfWeek,
    startTime,
    endTime,
    breakRanges: [],
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
    branchId: DEMO_BRANCH_ID,
    staffId: staffId ?? null,
    scope,
    title,
    reason: "Seeded demo block-off for shared booking availability.",
    startAt,
    endAt,
    active: true,
    createdAt: "2026-03-28T09:00:00+07:00",
    updatedAt: "2026-03-28T09:00:00+07:00",
  };
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
    referenceCode: `NL-${iso.replaceAll("-", "")}-${String(index + 1).padStart(4, "0")}`,
    shopId: "19nail-studio",
    customerId: null,
    customerSnapshot: {
      fullName: "Mock Customer",
      phoneE164: "+84900000000",
    },
    anonymousSessionId: null,
    branchId: DEMO_BRANCH_ID,
    date: iso,
    startTime,
    estimatedEndTime,
    durationMinutes,
    guestCount: 1,
    setType: "hands",
    nailType: "natural",
    polishStyle: "gel_solid",
    effects: ["none"],
    notes: "Seeded demo booking for availability simulation.",
    source: "website",
    channel: "web_self_booking",
    status: index % 2 === 0 ? "confirmed" : "checked_in",
    assignedStaffMode: "specific_staff",
    assignedStaffId: staffId,
    pricingSummary: null,
    paymentSummary: null,
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
      createdByActorId: "demo-seed",
      updatedByActorType: "system",
      updatedByActorId: "demo-seed",
    },
  };
}

function createSeed(value: string) {
  return value.split("").reduce((accumulator, currentChar) => {
    return accumulator + currentChar.charCodeAt(0);
  }, 0);
}

function convertMinutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
