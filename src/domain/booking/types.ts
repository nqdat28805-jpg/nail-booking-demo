export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
  "late_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_SOURCES = [
  "website",
  "facebook",
  "instagram",
  "phone",
  "walk_in",
] as const;

export type BookingSource = (typeof BOOKING_SOURCES)[number];

export const BOOKING_CHANNELS = [
  "web_self_booking",
  "social_assisted",
  "manual_staff_entry",
  "phone_assisted",
  "walk_in_assisted",
] as const;

export type BookingChannel = (typeof BOOKING_CHANNELS)[number];

export type StaffAssignmentMode = "pool" | "specific_staff";
export type SetType = "hands" | "feet" | "both";
export type NailType = "natural" | "tip" | "builder_gel";
export type PolishStyle = "gel_solid" | "glitter" | "cat_eye" | "chrome";
export type EffectOption = "none" | "sticker" | "design";

export type BookingActorType = "customer" | "staff" | "system";

export interface BookingCustomerSnapshot {
  fullName: string;
  phoneE164: string;
  phoneDisplay?: string | null;
}

export interface BookingServiceSelections {
  guestCount: number;
  setType: SetType;
  nailType: NailType;
  polishStyle: PolishStyle;
  effects: EffectOption[];
}

export type ServiceSelections = BookingServiceSelections;

export interface BookingAuditMetadata {
  createdByActorType: BookingActorType;
  createdByActorId?: string | null;
  updatedByActorType?: BookingActorType | null;
  updatedByActorId?: string | null;
}

export interface BookingTimestamps {
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string | null;
  checkedInAt?: string | null;
  actualCompletedAt?: string | null;
  cancelledAt?: string | null;
}

export interface Booking extends BookingServiceSelections {
  id: string;
  referenceCode: string;
  customerId?: string | null;
  customerSnapshot: BookingCustomerSnapshot;
  anonymousSessionId?: string | null;
  branchId?: string | null;
  date: string;
  startTime: string;
  estimatedEndTime: string;
  durationMinutes: number;
  notes?: string | null;
  source: BookingSource;
  channel: BookingChannel;
  status: BookingStatus;
  assignedStaffMode: StaffAssignmentMode;
  assignedStaffId?: string | null;
  timestamps: BookingTimestamps;
  auditMetadata: BookingAuditMetadata;
}

export type AuditAction =
  | "booking_created"
  | "booking_confirmed"
  | "booking_checked_in"
  | "booking_completed"
  | "booking_cancelled"
  | "booking_no_show"
  | "booking_rescheduled"
  | "booking_updated";

export interface AuditLogEntry {
  id: string;
  entityType: "booking";
  entityId: string;
  action: AuditAction;
  previousStatus?: BookingStatus | null;
  nextStatus?: BookingStatus | null;
  performedByActorType: BookingActorType;
  performedByActorId?: string | null;
  occurredAt: string;
  notes?: string | null;
  payload?: Record<string, unknown>;
}
