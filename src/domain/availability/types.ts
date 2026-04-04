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
  | "continuation"
  | "insufficient_duration";

export type AvailabilityInvalidationReasonCode =
  | "existing_booking"
  | "temporary_hold"
  | "outside_working_schedule"
  | "block_off"
  | "past_time"
  | "insufficient_contiguous_time"
  | "continuation_segment";

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
  invalidationReasonCode?: AvailabilityInvalidationReasonCode | null;
  continuousFreeMinutes: number;
  availableStaffIds?: string[];
  holdExpiresAt?: string | null;
  alternativeStartTimes?: string[];
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
  assignedStaffMode?: StaffAssignmentMode;
  durationMinutes?: number;
  createdBySessionId?: string | null;
  expiresAt: string;
  status: "active" | "expired" | "released" | "converted";
  createdAt?: string;
  updatedAt?: string;
}
