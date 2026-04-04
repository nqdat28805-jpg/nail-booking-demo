import type {
  EffectOption,
  NailType,
  PolishStyle,
  SetType,
  StaffAssignmentMode,
} from "@/src/domain/booking/types";

export type AvailabilitySlotState =
  | "available"
  | "booked"
  | "held"
  | "past"
  | "closed"
  | "insufficient_duration";

export interface DurationInput {
  guestCount: number;
  setType: SetType;
  nailType: NailType;
  polishStyle: PolishStyle;
  effects: EffectOption[];
  branchId?: string | null;
  requestedStaffId?: string | null;
  staffAssignmentMode: StaffAssignmentMode;
  processingStrategy?: "sequential" | "parallel";
}

export interface DurationEstimate {
  durationMinutes: number;
  blockedDurationMinutes: number;
  slotIntervalMinutes: number;
  estimatedEndTime?: string | null;
  matchedRuleCodes: string[];
  notes: string[];
}

export interface AvailabilityQuery {
  date: string;
  branchId?: string | null;
  requestedStaffId?: string | null;
  staffAssignmentMode: StaffAssignmentMode;
  durationInput: DurationInput;
  slotIntervalMinutes: number;
  includeAlternativeDates?: boolean;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  state: AvailabilitySlotState;
  reason?: string | null;
  continuousFreeMinutes: number;
  availableStaffIds?: string[];
  holdExpiresAt?: string | null;
}

export interface AvailabilityResult {
  date: string;
  query: AvailabilityQuery;
  estimate: DurationEstimate;
  slots: AvailabilitySlot[];
  suggestedDates: string[];
  generatedAt: string;
}

export interface TemporaryHold {
  id: string;
  branchId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  staffId?: string | null;
  createdBySessionId?: string | null;
  expiresAt: string;
  status: "active" | "expired" | "released" | "converted";
}
