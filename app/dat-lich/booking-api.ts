import type { AvailabilitySlot, DurationEstimate } from "@/src/domain/availability/types";
import type { Booking, BookingServiceSelections } from "@/src/domain/booking/types";
import type { Staff } from "@/src/domain/staff/types";
import type { PersistedBookingDraft, PersistedGuestDetailsDraft } from "./booking-mock";

export interface SharedBookingCalendarDay {
  key: string;
  iso: string | null;
  dayNumber: number;
  status: "available" | "limited" | "closed" | "outside";
  disabled: boolean;
  outsideMonth: boolean;
}

export interface SharedBookingCalendarMonth {
  monthLabel: string;
  days: SharedBookingCalendarDay[];
}

export interface SharedBookingContextPayload {
  source: "database" | "memory_fallback";
  staffOptions: Staff[];
  durationEstimate: DurationEstimate;
  calendarMonth: SharedBookingCalendarMonth;
  slots: AvailabilitySlot[];
}

export interface SharedBookingRecordPayload {
  source: "database" | "memory_fallback";
  booking: Booking;
  assignedStaffName?: string | null;
}

export class BookingApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
  }
}

export async function fetchSharedBookingContext(input: {
  visibleMonth: { year: number; monthIndex: number };
  selectedDate: string | null;
  selectedStaffId: string;
  serviceSelections: BookingServiceSelections;
  activeHoldSlot?: string | null;
}) {
  const response = await fetch("/api/public-booking/context", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseJsonResponse<SharedBookingContextPayload>(
    response,
    "Failed to load shared booking context.",
  );
}

export async function createSharedBooking(input: {
  bookingDraft: PersistedBookingDraft;
  guestDraft: PersistedGuestDetailsDraft;
}) {
  const response = await fetch("/api/public-booking/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseJsonResponse<SharedBookingRecordPayload>(
    response,
    "Failed to create shared booking.",
  );
}

export async function fetchSharedBookingById(id: string) {
  const response = await fetch(`/api/public-booking/bookings/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return parseJsonResponse<SharedBookingRecordPayload>(
    response,
    `Failed to load booking ${id}.`,
  );
}

async function parseJsonResponse<T>(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new BookingApiError(
      (payload as { message?: string } | null)?.message ?? fallbackMessage,
      response.status,
      payload,
    );
  }

  return payload as T;
}
