import type { AvailabilityQuery } from "@/src/domain/availability/types";
import type { Booking, BookingChannel, BookingSource } from "@/src/domain/booking/types";
import type { Customer } from "@/src/domain/customer/types";

export interface CreateBookingInput {
  customer: {
    customerId?: string | null;
    fullName: string;
    phoneE164: string;
    phoneDisplay?: string | null;
    anonymousSessionId?: string | null;
  };
  branchId?: string | null;
  date: string;
  startTime: string;
  guestCount: number;
  setType: Booking["setType"];
  nailType: Booking["nailType"];
  polishStyle: Booking["polishStyle"];
  effects: Booking["effects"];
  notes?: string | null;
  source: BookingSource;
  channel: BookingChannel;
  assignedStaffMode: Booking["assignedStaffMode"];
  assignedStaffId?: string | null;
  finalAvailabilityQuery: AvailabilityQuery;
}

export interface CustomerSearchQuery {
  name?: string;
  phone?: string;
  limit?: number;
}

export interface UpsertCustomerFromBookingInput {
  bookingId?: string | null;
  fullName: string;
  phoneE164: string;
  phoneDisplay?: string | null;
  anonymousSessionId?: string | null;
  notes?: string | null;
}

export interface BookingServiceContract {
  createBooking(input: CreateBookingInput): Promise<Booking>;
  getBookingById(id: string): Promise<Booking | null>;
  lookupBooking(referenceCode: string, phone: string): Promise<Booking | null>;
  confirmBooking(id: string): Promise<Booking>;
  checkInBooking(id: string): Promise<Booking>;
  completeBooking(id: string, actualCompletedAt: string): Promise<Booking>;
  cancelBooking(id: string, reason: string): Promise<Booking>;
  rescheduleBooking(
    id: string,
    newDate: string,
    newStartTime: string,
  ): Promise<Booking>;
  searchCustomers(query: CustomerSearchQuery): Promise<Customer[]>;
  upsertCustomerFromBooking(
    input: UpsertCustomerFromBookingInput,
  ): Promise<Customer>;
}

export const unimplementedBookingService: BookingServiceContract = {
  async createBooking() {
    throw new Error(
      "createBooking is a shared backend contract stub. Implement it against the booking service.",
    );
  },
  async getBookingById() {
    throw new Error(
      "getBookingById is a shared backend contract stub. Implement it against the booking service.",
    );
  },
  async lookupBooking() {
    throw new Error(
      "lookupBooking is a shared backend contract stub. Implement it against the booking service.",
    );
  },
  async confirmBooking() {
    throw new Error(
      "confirmBooking is a shared backend contract stub. Implement it against the booking service.",
    );
  },
  async checkInBooking() {
    throw new Error(
      "checkInBooking is a shared backend contract stub. Implement it against the booking service.",
    );
  },
  async completeBooking() {
    throw new Error(
      "completeBooking is a shared backend contract stub. Implement it against the booking service.",
    );
  },
  async cancelBooking() {
    throw new Error(
      "cancelBooking is a shared backend contract stub. Implement it against the booking service.",
    );
  },
  async rescheduleBooking() {
    throw new Error(
      "rescheduleBooking is a shared backend contract stub. Implement it against the booking service.",
    );
  },
  async searchCustomers() {
    throw new Error(
      "searchCustomers is a shared backend contract stub. Implement it against the customer service.",
    );
  },
  async upsertCustomerFromBooking() {
    throw new Error(
      "upsertCustomerFromBooking is a shared backend contract stub. Implement it against the customer service.",
    );
  },
};
