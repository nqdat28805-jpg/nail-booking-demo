export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Staff {
  id: string;
  displayName: string;
  initials: string;
  branchId?: string | null;
  active: boolean;
  sortOrder?: number;
  role?: "staff" | "manager" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleBreakRange {
  startTime: string;
  endTime: string;
}

export interface StaffWorkingSchedule {
  id: string;
  staffId: string;
  branchId?: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakRanges?: ScheduleBreakRange[];
  isWorkingDay: boolean;
  timezone: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockOff {
  id: string;
  branchId?: string | null;
  staffId?: string | null;
  scope: "staff" | "branch" | "global";
  title: string;
  reason?: string | null;
  startAt: string;
  endAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
