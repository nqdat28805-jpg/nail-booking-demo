import type { ServiceDurationRule } from "@/src/domain/config/types";
import type { BlockOff, ScheduleBreakRange, Staff, StaffWorkingSchedule } from "@/src/domain/staff/types";
import { DEMO_BRANCH_ID } from "@/src/server/demo/demo-seed";
import { getSharedBookingRuntime } from "@/src/server/runtime/shared-booking-runtime";

export const INTERNAL_SETUP_BRANCH_ID = DEMO_BRANCH_ID;

const LOOKUP_DATE_FROM = "2026-01-01";
const LOOKUP_DATE_TO = "2027-12-31";

export async function getInternalDashboardSnapshot() {
  const runtime = await getSharedBookingRuntime();
  const [staff, schedules, blockOffs, rules] = await Promise.all([
    runtime.repositories.staffRepository.listActive({
      branchId: INTERNAL_SETUP_BRANCH_ID,
      activeOnly: false,
    }),
    runtime.repositories.staffScheduleRepository.listByDateRange({
      branchId: INTERNAL_SETUP_BRANCH_ID,
      dateFrom: LOOKUP_DATE_FROM,
      dateTo: LOOKUP_DATE_TO,
    }),
    runtime.repositories.blockOffRepository.listActive({
      branchId: INTERNAL_SETUP_BRANCH_ID,
      dateFrom: toIsoDate(new Date()),
      dateTo: addDays(toIsoDate(new Date()), 30),
      activeOnly: false,
    }),
    runtime.repositories.serviceDurationRuleRepository.listActive({
      branchId: INTERNAL_SETUP_BRANCH_ID,
      activeOnly: false,
    }),
  ]);

  return {
    source: runtime.source,
    branchId: INTERNAL_SETUP_BRANCH_ID,
    counts: {
      staff: staff.length,
      activeStaff: staff.filter((member) => member.active).length,
      schedules: schedules.length,
      blockOffs: blockOffs.length,
      rules: rules.length,
    },
  };
}

export async function listInternalStaff() {
  const runtime = await getSharedBookingRuntime();
  const staff = await runtime.repositories.staffRepository.listActive({
    branchId: INTERNAL_SETUP_BRANCH_ID,
    activeOnly: false,
  });

  return {
    source: runtime.source,
    items: staff.sort((left, right) => {
      return (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
    }),
  };
}

export async function createInternalStaff(input: {
  displayName: string;
  initials?: string | null;
  active?: boolean;
  sortOrder?: number;
}) {
  const runtime = await getSharedBookingRuntime();
  const timestamp = new Date().toISOString();
  const staff: Staff = {
    id: `staff-${crypto.randomUUID()}`,
    displayName: input.displayName.trim(),
    initials: (input.initials?.trim() || deriveInitials(input.displayName)).slice(0, 3),
    branchId: INTERNAL_SETUP_BRANCH_ID,
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
    role: "staff",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return runtime.repositories.staffRepository.create(staff);
}

export async function updateInternalStaff(
  id: string,
  patch: Partial<Pick<Staff, "displayName" | "initials" | "active" | "sortOrder">>,
) {
  const runtime = await getSharedBookingRuntime();
  const current = await runtime.repositories.staffRepository.findById(id);

  if (!current) {
    throw new Error(`Staff ${id} not found.`);
  }

  const nextDisplayName = patch.displayName?.trim() ?? current.displayName;
  return runtime.repositories.staffRepository.update(id, {
    ...patch,
    displayName: nextDisplayName,
    initials:
      patch.initials !== undefined
        ? (patch.initials.trim() || deriveInitials(nextDisplayName)).slice(0, 3)
        : undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function getInternalStaffSchedules(staffId: string) {
  const runtime = await getSharedBookingRuntime();
  const [staff, schedules] = await Promise.all([
    runtime.repositories.staffRepository.findById(staffId),
    runtime.repositories.staffScheduleRepository.listByDateRange({
      branchId: INTERNAL_SETUP_BRANCH_ID,
      staffIds: [staffId],
      dateFrom: LOOKUP_DATE_FROM,
      dateTo: LOOKUP_DATE_TO,
    }),
  ]);

  return {
    source: runtime.source,
    staff,
    items: buildWeeklyScheduleMatrix(staffId, schedules),
  };
}

export async function replaceInternalStaffSchedules(input: {
  staffId: string;
  schedules: Array<{
    dayOfWeek: StaffWorkingSchedule["dayOfWeek"];
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
    breakRanges?: ScheduleBreakRange[];
  }>;
}) {
  const runtime = await getSharedBookingRuntime();
  const timestamp = new Date().toISOString();
  for (const schedule of input.schedules) {
    if (
      schedule.isWorkingDay &&
      convertTimeToMinutes(schedule.endTime) <= convertTimeToMinutes(schedule.startTime)
    ) {
      throw new Error("endTime must be later than startTime for working days.");
    }
  }
  const payload = input.schedules.map((schedule) => ({
    id: `schedule-${input.staffId}-${schedule.dayOfWeek}`,
    staffId: input.staffId,
    branchId: INTERNAL_SETUP_BRANCH_ID,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    breakRanges: schedule.breakRanges ?? [],
    isWorkingDay: schedule.isWorkingDay,
    timezone: "Asia/Bangkok",
    effectiveFrom: null,
    effectiveTo: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })) satisfies StaffWorkingSchedule[];

  return runtime.repositories.staffScheduleRepository.replaceForStaff(
    input.staffId,
    payload,
  );
}

export async function listInternalBlockOffs(input?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  const runtime = await getSharedBookingRuntime();
  const dateFrom = input?.dateFrom ?? toIsoDate(new Date());
  const dateTo = input?.dateTo ?? addDays(dateFrom, 45);
  const items = await runtime.repositories.blockOffRepository.listActive({
    branchId: INTERNAL_SETUP_BRANCH_ID,
    dateFrom,
    dateTo,
    activeOnly: false,
  });

  return {
    source: runtime.source,
    items: items.sort((left, right) => left.startAt.localeCompare(right.startAt)),
  };
}

export async function createInternalBlockOff(input: {
  scope: "branch" | "staff";
  staffId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
}) {
  const runtime = await getSharedBookingRuntime();
  if (convertTimeToMinutes(input.endTime) <= convertTimeToMinutes(input.startTime)) {
    throw new Error("endTime must be later than startTime.");
  }
  const timestamp = new Date().toISOString();
  const blockOff: BlockOff = {
    id: `block-${crypto.randomUUID()}`,
    branchId: INTERNAL_SETUP_BRANCH_ID,
    staffId: input.scope === "staff" ? input.staffId ?? null : null,
    scope: input.scope,
    title: input.reason?.trim() || (input.scope === "staff" ? "Block thợ" : "Block salon"),
    reason: input.reason?.trim() || null,
    startAt: `${input.date}T${input.startTime}:00+07:00`,
    endAt: `${input.date}T${input.endTime}:00+07:00`,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return runtime.repositories.blockOffRepository.create(blockOff);
}

export async function deleteInternalBlockOff(id: string) {
  const runtime = await getSharedBookingRuntime();
  await runtime.repositories.blockOffRepository.delete(id);
}

export async function listInternalDurationRules() {
  const runtime = await getSharedBookingRuntime();
  const items = await runtime.repositories.serviceDurationRuleRepository.listActive({
    branchId: INTERNAL_SETUP_BRANCH_ID,
    activeOnly: false,
  });

  return {
    source: runtime.source,
    items: items.sort((left, right) => left.code.localeCompare(right.code)),
  };
}

export async function updateInternalDurationRule(
  id: string,
  patch: Partial<
    Pick<
      ServiceDurationRule,
      | "baseDurationMinutes"
      | "blockRoundToMinutes"
      | "guestCountStrategy"
      | "guestCountMultiplier"
      | "active"
      | "notes"
    >
  >,
) {
  const runtime = await getSharedBookingRuntime();
  return runtime.repositories.serviceDurationRuleRepository.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

function buildWeeklyScheduleMatrix(
  staffId: string,
  schedules: StaffWorkingSchedule[],
) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const existing =
      schedules.find((schedule) => schedule.dayOfWeek === dayOfWeek) ?? null;

    return (
      existing ?? {
        id: `draft-${staffId}-${dayOfWeek}`,
        staffId,
        branchId: INTERNAL_SETUP_BRANCH_ID,
        dayOfWeek: dayOfWeek as StaffWorkingSchedule["dayOfWeek"],
        startTime: "09:00",
        endTime: "20:00",
        breakRanges: [],
        isWorkingDay: false,
        timezone: "Asia/Bangkok",
        effectiveFrom: null,
        effectiveTo: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  });
}

function deriveInitials(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3) || "NV";
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(isoDate: string, daysToAdd: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  return toIsoDate(date);
}

function convertTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
