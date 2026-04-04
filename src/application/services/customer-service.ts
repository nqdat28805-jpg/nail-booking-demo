import type {
  CustomerSearchQuery,
  UpsertCustomerFromBookingInput,
} from "@/src/domain/booking/contracts";
import type { Customer } from "@/src/domain/customer/types";
import type { CustomerRepository } from "@/src/domain/repositories/contracts";

export interface CustomerService {
  searchCustomers(query: CustomerSearchQuery): Promise<Customer[]>;
  upsertCustomerFromBooking(input: UpsertCustomerFromBookingInput): Promise<Customer>;
}

export class DefaultCustomerService implements CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async searchCustomers(query: CustomerSearchQuery) {
    return this.customerRepository.search(query);
  }

  async upsertCustomerFromBooking(input: UpsertCustomerFromBookingInput) {
    const existingCustomer = await this.customerRepository.findByPhoneE164(
      input.phoneE164,
    );

    if (existingCustomer) {
      return this.customerRepository.update(existingCustomer.id, {
        fullName: input.fullName,
        phoneDisplay: input.phoneDisplay ?? existingCustomer.phoneDisplay ?? null,
        notes: input.notes ?? existingCustomer.notes ?? null,
        anonymousSessionId:
          input.anonymousSessionId ?? existingCustomer.anonymousSessionId ?? null,
        updatedAt: new Date().toISOString(),
      } satisfies Partial<Customer>);
    }

    return this.customerRepository.create({
      id: `customer-${Date.now()}`,
      fullName: input.fullName,
      phoneE164: input.phoneE164,
      phoneDisplay: input.phoneDisplay ?? null,
      notes: input.notes ?? null,
      anonymousSessionId: input.anonymousSessionId ?? null,
      latestBookingId: input.bookingId ?? null,
      preferredLocale: "vi-VN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
