import type { BookingStatus } from "@/src/domain/booking/types";

export const WEB_DEFAULT_BOOKING_STATUS: BookingStatus = "pending";

export const VALID_BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  BookingStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "completed", "cancelled", "no_show", "late_show"],
  checked_in: ["completed", "no_show"],
  completed: [],
  cancelled: [],
  no_show: ["cancelled"],
  late_show: ["checked_in", "no_show", "cancelled"],
};

export interface BookingLifecycleRule {
  code: string;
  summary: string;
  detail: string;
}

export const BOOKING_LIFECYCLE_RULES: BookingLifecycleRule[] = [
  {
    code: "BR-01",
    summary: "Only stored bookings count as real bookings.",
    detail:
      "A booking only affects the shared system after it has been created and stored; chat messages or local drafts are not bookings.",
  },
  {
    code: "BR-02",
    summary: "Booking source and booking channel stay separate.",
    detail:
      "Source captures where the customer came from, while channel captures how the booking was finalized.",
  },
  {
    code: "BR-05",
    summary: "Final availability recheck is required before create or confirm.",
    detail:
      "Every create or confirm path must run the availability engine again to avoid race conditions.",
  },
  {
    code: "BR-09",
    summary: "Web bookings default to pending.",
    detail:
      "The shared foundation assumes public web bookings are pending by default unless salon policy later overrides it.",
  },
  {
    code: "BR-11",
    summary: "TEMP_HOLD is separate from booking status.",
    detail:
      "Temporary slot holds are not part of the booking status enum and must expire or convert independently.",
  },
  {
    code: "BR-14",
    summary: "Completed early can release future availability later.",
    detail:
      "The domain captures actual completion time so a future engine can reopen remaining unused time immediately.",
  },
];

export function canTransitionBookingStatus(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus,
) {
  return VALID_BOOKING_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}
