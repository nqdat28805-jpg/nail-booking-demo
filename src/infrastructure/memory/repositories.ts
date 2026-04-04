import type { DurationInput, TemporaryHold } from "@/src/domain/availability/types";
import type { AuditLogEntry, Booking } from "@/src/domain/booking/types";
import type { ServiceDurationRule } from "@/src/domain/config/types";
import type { Customer } from "@/src/domain/customer/types";
import type {
  AuditLogRepository,
  BlockOffLookupQuery,
  BlockOffRepository,
  BookingDateRangeQuery,
  BookingRepository,
  CustomerRepository,
  ServiceDurationRuleLookupQuery,
  ServiceDurationRuleRepository,
  StaffLookupQuery,
  StaffRepository,
  StaffScheduleLookupQuery,
  StaffScheduleRepository,
  TemporaryHoldLookupQuery,
} from "@/src/domain/repositories/contracts";
import type { BlockOff, Staff, StaffWorkingSchedule } from "@/src/domain/staff/types";

type SeedBookingFactory = (input: { staffId: string; date: string }) => Booking[];
type SeedHoldFactory = (input: { staffId: string; date: string }) => TemporaryHold[];

export class InMemoryBookingRepository implements BookingRepository {
  private readonly persistedBookings = new Map<string, Booking>();
  private readonly persistedHolds = new Map<string, TemporaryHold>();

  constructor(
    private readonly options: {
      bookings?: Booking[];
      temporaryHolds?: TemporaryHold[];
      seedBookingsByStaffAndDate?: SeedBookingFactory;
      seedTemporaryHoldsByStaffAndDate?: SeedHoldFactory;
    } = {},
  ) {
    for (const booking of options.bookings ?? []) {
      this.persistedBookings.set(booking.id, booking);
    }

    for (const hold of options.temporaryHolds ?? []) {
      this.persistedHolds.set(hold.id, hold);
    }
  }

  async findById(id: string) {
    return this.persistedBookings.get(id) ?? null;
  }

  async findByReferenceAndPhone(referenceCode: string, phoneE164: string) {
    for (const booking of this.persistedBookings.values()) {
      if (
        booking.referenceCode === referenceCode &&
        booking.customerSnapshot.phoneE164 === phoneE164
      ) {
        return booking;
      }
    }

    return null;
  }

  async create(booking: Booking) {
    this.persistedBookings.set(booking.id, booking);
    return booking;
  }

  async update(id: string, patch: Partial<Booking>) {
    const existingBooking = this.persistedBookings.get(id);

    if (!existingBooking) {
      throw new Error(`Booking ${id} was not found in memory.`);
    }

    const updatedBooking = {
      ...existingBooking,
      ...patch,
      timestamps: {
        ...existingBooking.timestamps,
        ...(patch.timestamps ?? {}),
      },
      auditMetadata: {
        ...existingBooking.auditMetadata,
        ...(patch.auditMetadata ?? {}),
      },
    };
    this.persistedBookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async listByDateRange(query: BookingDateRangeQuery) {
    const seeded = this.getSeededBookings(query.staffIds ?? [], query.dateFrom);
    const persisted = Array.from(this.persistedBookings.values());
    const combined = dedupeById([...seeded, ...persisted]);

    return combined.filter((booking) => {
      const matchesDate =
        booking.date >= query.dateFrom && booking.date <= query.dateTo;
      const matchesStaff =
        !query.staffIds?.length ||
        (booking.assignedStaffId ? query.staffIds.includes(booking.assignedStaffId) : false);
      const matchesStatus =
        !query.statuses?.length || query.statuses.includes(booking.status);
      const matchesBranch =
        query.branchId === undefined || booking.branchId === query.branchId;

      return matchesDate && matchesStaff && matchesStatus && matchesBranch;
    });
  }

  async listByStaffAndDate(staffId: string, date: string) {
    const seeded = this.getSeededBookings([staffId], date);
    const persisted = Array.from(this.persistedBookings.values());
    return dedupeById([...seeded, ...persisted]).filter(
      (booking) => booking.date === date && booking.assignedStaffId === staffId,
    );
  }

  async listActiveTemporaryHolds(query: TemporaryHoldLookupQuery) {
    const seeded = this.getSeededTemporaryHolds(query.staffIds ?? [], query.date);
    const persisted = Array.from(this.persistedHolds.values());
    return dedupeById([...seeded, ...persisted]).filter((hold) => {
      const matchesDate = hold.date === query.date;
      const matchesStaff =
        !query.staffIds?.length ||
        (hold.staffId ? query.staffIds.includes(hold.staffId) : false);
      const matchesStatus =
        !query.statuses?.length || query.statuses.includes(hold.status);
      const matchesBranch =
        query.branchId === undefined || hold.branchId === query.branchId;

      return matchesDate && matchesStaff && matchesStatus && matchesBranch;
    });
  }

  async saveTemporaryHold(hold: TemporaryHold) {
    this.persistedHolds.set(hold.id, hold);
    return hold;
  }

  async updateTemporaryHold(id: string, patch: Partial<TemporaryHold>) {
    const existingHold = this.persistedHolds.get(id);

    if (!existingHold) {
      throw new Error(`Temporary hold ${id} was not found in memory.`);
    }

    const updatedHold = {
      ...existingHold,
      ...patch,
    };
    this.persistedHolds.set(id, updatedHold);
    return updatedHold;
  }

  private getSeededBookings(staffIds: string[], date: string) {
    return staffIds.flatMap((staffId) =>
      this.options.seedBookingsByStaffAndDate?.({ staffId, date }) ?? [],
    );
  }

  private getSeededTemporaryHolds(staffIds: string[], date: string) {
    return staffIds.flatMap((staffId) =>
      this.options.seedTemporaryHoldsByStaffAndDate?.({ staffId, date }) ?? [],
    );
  }
}

export class InMemoryCustomerRepository implements CustomerRepository {
  private readonly customers = new Map<string, Customer>();

  constructor(seedCustomers: Customer[] = []) {
    for (const customer of seedCustomers) {
      this.customers.set(customer.id, customer);
    }
  }

  async findById(id: string) {
    return this.customers.get(id) ?? null;
  }

  async findByPhoneE164(phoneE164: string) {
    for (const customer of this.customers.values()) {
      if (customer.phoneE164 === phoneE164) {
        return customer;
      }
    }

    return null;
  }

  async create(customer: Customer) {
    this.customers.set(customer.id, customer);
    return customer;
  }

  async update(id: string, patch: Partial<Customer>) {
    const existingCustomer = this.customers.get(id);

    if (!existingCustomer) {
      throw new Error(`Customer ${id} was not found in memory.`);
    }

    const updatedCustomer = {
      ...existingCustomer,
      ...patch,
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async search(query: { name?: string; phone?: string; limit?: number }) {
    const normalizedName = query.name?.trim().toLowerCase() ?? "";
    const normalizedPhone = query.phone?.replace(/\D/g, "") ?? "";

    return Array.from(this.customers.values())
      .filter((customer) => {
        const matchesName =
          !normalizedName ||
          customer.fullName.toLowerCase().includes(normalizedName);
        const matchesPhone =
          !normalizedPhone ||
          customer.phoneE164.replace(/\D/g, "").includes(normalizedPhone) ||
          (customer.phoneDisplay ?? "").replace(/\D/g, "").includes(normalizedPhone);

        return matchesName && matchesPhone;
      })
      .slice(0, query.limit ?? 10);
  }
}

export class InMemoryStaffRepository implements StaffRepository {
  private readonly staffMembers = new Map<string, Staff>();

  constructor(seedStaffMembers: Staff[]) {
    for (const staff of seedStaffMembers) {
      this.staffMembers.set(staff.id, staff);
    }
  }

  async findById(id: string) {
    return this.staffMembers.get(id) ?? null;
  }

  async listActive(query: StaffLookupQuery = {}) {
    return Array.from(this.staffMembers.values()).filter((staff) => {
      const matchesIds = !query.ids?.length || query.ids.includes(staff.id);
      const matchesBranch =
        query.branchId === undefined || staff.branchId === query.branchId;
      const matchesActive = query.activeOnly === false ? true : staff.active;

      return matchesIds && matchesBranch && matchesActive;
    });
  }

  async create(staff: Staff) {
    this.staffMembers.set(staff.id, staff);
    return staff;
  }

  async update(id: string, patch: Partial<Staff>) {
    const existingStaff = this.staffMembers.get(id);

    if (!existingStaff) {
      throw new Error(`Staff ${id} was not found in memory.`);
    }

    const updatedStaff = {
      ...existingStaff,
      ...patch,
    };
    this.staffMembers.set(id, updatedStaff);
    return updatedStaff;
  }
}

export class InMemoryStaffScheduleRepository implements StaffScheduleRepository {
  private schedules: StaffWorkingSchedule[];

  constructor(schedules: StaffWorkingSchedule[]) {
    this.schedules = [...schedules];
  }

  async listByDateRange(query: StaffScheduleLookupQuery) {
    return this.schedules.filter((schedule) => {
      const matchesStaff =
        !query.staffIds?.length || query.staffIds.includes(schedule.staffId);
      const matchesBranch =
        query.branchId === undefined || schedule.branchId === query.branchId;
      const effectiveFromOk =
        !schedule.effectiveFrom || schedule.effectiveFrom <= query.dateTo;
      const effectiveToOk =
        !schedule.effectiveTo || schedule.effectiveTo >= query.dateFrom;

      return matchesStaff && matchesBranch && effectiveFromOk && effectiveToOk;
    });
  }

  async replaceForStaff(staffId: string, schedules: StaffWorkingSchedule[]) {
    const template = schedules[0] ?? null;
    const targetEffectiveFrom = template?.effectiveFrom ?? null;
    const targetEffectiveTo = template?.effectiveTo ?? null;

    this.schedules = [
      ...this.schedules.filter((schedule) => {
        if (schedule.staffId !== staffId) {
          return true;
        }

        return !(
          (schedule.effectiveFrom ?? null) === targetEffectiveFrom &&
          (schedule.effectiveTo ?? null) === targetEffectiveTo
        );
      }),
      ...schedules,
    ];

    return this.schedules
      .filter(
        (schedule) =>
          schedule.staffId === staffId &&
          (schedule.effectiveFrom ?? null) === targetEffectiveFrom &&
          (schedule.effectiveTo ?? null) === targetEffectiveTo,
      )
      .sort((left, right) => left.dayOfWeek - right.dayOfWeek);
  }
}

export class InMemoryBlockOffRepository implements BlockOffRepository {
  private blockOffs: BlockOff[];

  constructor(blockOffs: BlockOff[]) {
    this.blockOffs = [...blockOffs];
  }

  async listActive(query: BlockOffLookupQuery) {
    return this.blockOffs.filter((block) => {
      const blockStart = toIsoDate(new Date(block.startAt));
      const blockEnd = toIsoDate(new Date(block.endAt));
      const matchesActive = query.activeOnly === false ? true : block.active;
      const matchesDate =
        blockStart <= query.dateTo && blockEnd >= query.dateFrom;
      const matchesStaff =
        !query.staffIds?.length ||
        !block.staffId ||
        query.staffIds.includes(block.staffId);
      const matchesScope =
        !query.scopes?.length || query.scopes.includes(block.scope);
      const matchesBranch =
        query.branchId === undefined ||
        block.branchId === query.branchId ||
        block.scope === "global";

      return matchesActive && matchesDate && matchesStaff && matchesScope && matchesBranch;
    });
  }

  async findById(id: string) {
    return this.blockOffs.find((block) => block.id === id) ?? null;
  }

  async create(blockOff: BlockOff) {
    this.blockOffs = [blockOff, ...this.blockOffs];
    return blockOff;
  }

  async delete(id: string) {
    this.blockOffs = this.blockOffs.filter((block) => block.id !== id);
  }
}

export class InMemoryServiceDurationRuleRepository
  implements ServiceDurationRuleRepository
{
  private readonly rules: ServiceDurationRule[];

  constructor(rules: ServiceDurationRule[]) {
    this.rules = [...rules];
  }

  async listActive(query: ServiceDurationRuleLookupQuery = {}) {
    return this.rules.filter((rule) => {
      const matchesActive = query.activeOnly === false ? true : rule.active;
      const matchesBranch =
        query.branchId === undefined || rule.branchId === query.branchId;

      return matchesActive && matchesBranch;
    });
  }

  async findBestMatch(input: DurationInput) {
    const branchScoped = await this.listActive({
      branchId: input.branchId ?? undefined,
      activeOnly: true,
    });
    const candidates =
      branchScoped.length > 0
        ? branchScoped
        : this.rules.filter((rule) => rule.active);

    return (
      candidates.find(
        (rule) =>
          rule.setType === input.setType &&
          rule.nailType === input.nailType &&
          rule.polishStyle === input.polishStyle &&
          (rule.effectOption === "any" || input.effects.includes(rule.effectOption)),
      ) ?? null
    );
  }

  async findById(id: string) {
    return this.rules.find((rule) => rule.id === id) ?? null;
  }

  async update(id: string, patch: Partial<ServiceDurationRule>) {
    const index = this.rules.findIndex((rule) => rule.id === id);

    if (index < 0) {
      throw new Error(`Duration rule ${id} was not found in memory.`);
    }

    const updatedRule = {
      ...this.rules[index],
      ...patch,
    };
    this.rules[index] = updatedRule;
    return updatedRule;
  }
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly entries: AuditLogEntry[] = [];

  async saveAuditEntry(entry: AuditLogEntry) {
    this.entries.push(entry);
    return entry;
  }

  async listByEntity(entityType: AuditLogEntry["entityType"], entityId: string) {
    return this.entries.filter(
      (entry) => entry.entityType === entityType && entry.entityId === entityId,
    );
  }
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const byId = new Map<string, T>();

  for (const item of items) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values());
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}
