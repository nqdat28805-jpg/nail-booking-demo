import type {
  BookingServiceContract,
  CreateBookingInput,
  CustomerSearchQuery,
  UpsertCustomerFromBookingInput,
} from "@/src/domain/booking/contracts";
import type { AvailabilityServiceContract } from "@/src/domain/availability/contracts";
import type {
  AuditLogEntry,
  Booking,
  BookingStatus,
} from "@/src/domain/booking/types";
import {
  canTransitionBookingStatus,
  WEB_DEFAULT_BOOKING_STATUS,
} from "@/src/domain/booking/lifecycle";
import type {
  AuditLogRepository,
  BookingRepository,
} from "@/src/domain/repositories/contracts";
import type { CustomerService } from "@/src/application/services/customer-service";
import type { DurationService } from "@/src/application/services/duration-service";

export interface BookingServiceDependencies {
  bookingRepository: BookingRepository;
  auditLogRepository: AuditLogRepository;
  customerService: CustomerService;
  durationService: DurationService;
  availabilityService: AvailabilityServiceContract;
  now?: () => Date;
}

export class DefaultBookingService implements BookingServiceContract {
  constructor(private readonly dependencies: BookingServiceDependencies) {}

  async createBooking(input: CreateBookingInput) {
    const availability = await this.dependencies.availabilityService.queryAvailability(
      input.finalAvailabilityQuery,
    );
    const selectedSlot = availability.slots.find(
      (slot) => slot.startTime === input.startTime,
    );

    if (!selectedSlot || selectedSlot.state !== "available") {
      throw new Error(
        "createBooking requires a final availability recheck before storing the booking.",
      );
    }

    const durationEstimate = await this.dependencies.durationService.estimateDuration(
      input.finalAvailabilityQuery.durationInput,
    );
    const nowIso = this.getNowIso();
    const booking: Booking = {
      id: `booking-${Date.now()}`,
      referenceCode: buildReferenceCode(input.date, input.customer.phoneE164),
      shopId: input.shopId ?? null,
      customerId: input.customer.customerId ?? null,
      customerSnapshot: {
        fullName: input.customer.fullName,
        phoneE164: input.customer.phoneE164,
        phoneDisplay: input.customer.phoneDisplay ?? null,
      },
      anonymousSessionId: input.customer.anonymousSessionId ?? null,
      branchId: input.branchId ?? null,
      date: input.date,
      startTime: input.startTime,
      estimatedEndTime: durationEstimate.estimatedEndTime ?? selectedSlot.endTime,
      durationMinutes: durationEstimate.durationMinutes,
      guestCount: input.guestCount,
      setType: input.setType,
      nailType: input.nailType,
      polishStyle: input.polishStyle,
      effects: input.effects,
      notes: input.notes ?? null,
      source: input.source,
      channel: input.channel,
      status: WEB_DEFAULT_BOOKING_STATUS,
      assignedStaffMode: input.assignedStaffMode,
      assignedStaffId: input.assignedStaffId ?? null,
      pricingSummary: input.pricingSummary ?? null,
      paymentSummary: input.paymentSummary ?? null,
      timestamps: {
        createdAt: nowIso,
        updatedAt: nowIso,
        confirmedAt: null,
        checkedInAt: null,
        actualCompletedAt: null,
        cancelledAt: null,
      },
      auditMetadata: {
        createdByActorType: input.source === "website" ? "customer" : "staff",
        createdByActorId:
          input.customer.customerId ?? input.customer.anonymousSessionId ?? null,
        updatedByActorType: input.source === "website" ? "customer" : "staff",
        updatedByActorId:
          input.customer.customerId ?? input.customer.anonymousSessionId ?? null,
      },
    };

    const stored = await this.dependencies.bookingRepository.create(booking);
    await this.writeAuditEntry(stored.id, "booking_created", null, stored.status);
    return stored;
  }

  async getBookingById(id: string) {
    return this.dependencies.bookingRepository.findById(id);
  }

  async lookupBooking(referenceCode: string, phone: string) {
    return this.dependencies.bookingRepository.findByReferenceAndPhone(
      referenceCode,
      phone,
    );
  }

  async confirmBooking(id: string) {
    return this.transitionStatus(id, "confirmed", {
      confirmedAt: this.getNowIso(),
    });
  }

  async checkInBooking(id: string) {
    return this.transitionStatus(id, "checked_in", {
      checkedInAt: this.getNowIso(),
    });
  }

  async completeBooking(id: string, actualCompletedAt: string) {
    return this.transitionStatus(id, "completed", {
      actualCompletedAt,
    });
  }

  async cancelBooking(id: string, reason: string) {
    return this.transitionStatus(id, "cancelled", {
      cancelledAt: this.getNowIso(),
      notes: reason,
    });
  }

  async rescheduleBooking(id: string, newDate: string, newStartTime: string) {
    const booking = await this.requireBooking(id);
    const durationEstimate = await this.dependencies.durationService.estimateDuration({
      guestCount: booking.guestCount,
      setType: booking.setType,
      nailType: booking.nailType,
      polishStyle: booking.polishStyle,
      effects: booking.effects,
      branchId: booking.branchId ?? null,
      requestedStaffId: booking.assignedStaffId ?? null,
      staffAssignmentMode: booking.assignedStaffMode,
      processingStrategy: "sequential",
    });

    const updatedBooking = await this.dependencies.bookingRepository.update(id, {
      date: newDate,
      startTime: newStartTime,
      estimatedEndTime: durationEstimate.estimatedEndTime ?? booking.estimatedEndTime,
      durationMinutes: durationEstimate.durationMinutes,
      timestamps: {
        ...booking.timestamps,
        updatedAt: this.getNowIso(),
      },
    });
    await this.writeAuditEntry(
      updatedBooking.id,
      "booking_rescheduled",
      booking.status,
      updatedBooking.status,
      `Rescheduled to ${newDate} ${newStartTime}.`,
    );

    return updatedBooking;
  }

  async searchCustomers(query: CustomerSearchQuery) {
    return this.dependencies.customerService.searchCustomers(query);
  }

  async upsertCustomerFromBooking(input: UpsertCustomerFromBookingInput) {
    return this.dependencies.customerService.upsertCustomerFromBooking(input);
  }

  private async transitionStatus(
    id: string,
    nextStatus: BookingStatus,
    timestampPatch: Partial<Booking["timestamps"]> & Partial<Booking>,
  ) {
    const booking = await this.requireBooking(id);

    if (!canTransitionBookingStatus(booking.status, nextStatus)) {
      throw new Error(
        `Invalid booking status transition from ${booking.status} to ${nextStatus}.`,
      );
    }

    const updatedBooking = await this.dependencies.bookingRepository.update(id, {
      ...timestampPatch,
      status: nextStatus,
      timestamps: {
        ...booking.timestamps,
        ...(timestampPatch.timestamps ?? {}),
        updatedAt: this.getNowIso(),
      },
      auditMetadata: {
        ...booking.auditMetadata,
        updatedByActorType: "staff",
        updatedByActorId: "booking-service",
      },
    });

    await this.writeAuditEntry(
      updatedBooking.id,
      getAuditActionForStatus(nextStatus),
      booking.status,
      nextStatus,
    );

    return updatedBooking;
  }

  private async requireBooking(id: string) {
    const booking = await this.dependencies.bookingRepository.findById(id);

    if (!booking) {
      throw new Error(`Booking ${id} was not found.`);
    }

    return booking;
  }

  private async writeAuditEntry(
    bookingId: string,
    action: AuditLogEntry["action"],
    previousStatus: BookingStatus | null,
    nextStatus: BookingStatus,
    notes?: string,
  ) {
    await this.dependencies.auditLogRepository.saveAuditEntry({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      entityType: "booking",
      entityId: bookingId,
      action,
      previousStatus,
      nextStatus,
      performedByActorType: "system",
      performedByActorId: "booking-service",
      occurredAt: this.getNowIso(),
      notes: notes ?? null,
      payload: {},
    });
  }

  private getNowIso() {
    return (this.dependencies.now?.() ?? new Date()).toISOString();
  }
}

function buildReferenceCode(date: string, phoneE164: string) {
  const datePart = date.replaceAll("-", "");
  const phonePart = phoneE164.replace(/\D/g, "").slice(-4).padStart(4, "0");
  return `NL-${datePart}-${phonePart}`;
}

function getAuditActionForStatus(status: BookingStatus): AuditLogEntry["action"] {
  switch (status) {
    case "confirmed":
      return "booking_confirmed";
    case "checked_in":
      return "booking_checked_in";
    case "completed":
      return "booking_completed";
    case "cancelled":
      return "booking_cancelled";
    case "no_show":
      return "booking_no_show";
    default:
      return "booking_updated";
  }
}
