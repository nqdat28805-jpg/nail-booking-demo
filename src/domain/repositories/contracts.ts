import type {
  AvailabilityQuery,
  DurationInput,
  TemporaryHold,
} from "@/src/domain/availability/types";
import type {
  AuditLogEntry,
  Booking,
  BookingStatus,
} from "@/src/domain/booking/types";
import type { ServiceDurationRule } from "@/src/domain/config/types";
import type { Customer } from "@/src/domain/customer/types";
import type { BlockOff, Staff, StaffWorkingSchedule } from "@/src/domain/staff/types";

export interface DateRangeQuery {
  branchId?: string | null;
  dateFrom: string;
  dateTo: string;
}

export interface BookingDateRangeQuery extends DateRangeQuery {
  staffIds?: string[];
  statuses?: BookingStatus[];
}

export interface TemporaryHoldLookupQuery {
  branchId?: string | null;
  date: string;
  staffIds?: string[];
  statuses?: TemporaryHold["status"][];
}

export interface StaffLookupQuery {
  branchId?: string | null;
  ids?: string[];
  activeOnly?: boolean;
}

export interface StaffScheduleLookupQuery extends DateRangeQuery {
  staffIds?: string[];
}

export interface BlockOffLookupQuery extends DateRangeQuery {
  staffIds?: string[];
  scopes?: BlockOff["scope"][];
  activeOnly?: boolean;
}

export interface ServiceDurationRuleLookupQuery {
  branchId?: string | null;
  activeOnly?: boolean;
}

export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByReferenceAndPhone(referenceCode: string, phoneE164: string): Promise<Booking | null>;
  create(booking: Booking): Promise<Booking>;
  update(id: string, patch: Partial<Booking>): Promise<Booking>;
  listByDateRange(query: BookingDateRangeQuery): Promise<Booking[]>;
  listByStaffAndDate(staffId: string, date: string): Promise<Booking[]>;
  listActiveTemporaryHolds(query: TemporaryHoldLookupQuery): Promise<TemporaryHold[]>;
  saveTemporaryHold(hold: TemporaryHold): Promise<TemporaryHold>;
  updateTemporaryHold(id: string, patch: Partial<TemporaryHold>): Promise<TemporaryHold>;
}

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByPhoneE164(phoneE164: string): Promise<Customer | null>;
  create(customer: Customer): Promise<Customer>;
  update(id: string, patch: Partial<Customer>): Promise<Customer>;
  search(query: {
    name?: string;
    phone?: string;
    limit?: number;
  }): Promise<Customer[]>;
}

export interface StaffRepository {
  findById(id: string): Promise<Staff | null>;
  listActive(query?: StaffLookupQuery): Promise<Staff[]>;
  create(staff: Staff): Promise<Staff>;
  update(id: string, patch: Partial<Staff>): Promise<Staff>;
}

export interface StaffScheduleRepository {
  listByDateRange(query: StaffScheduleLookupQuery): Promise<StaffWorkingSchedule[]>;
  replaceForStaff(
    staffId: string,
    schedules: StaffWorkingSchedule[],
  ): Promise<StaffWorkingSchedule[]>;
}

export interface BlockOffRepository {
  listActive(query: BlockOffLookupQuery): Promise<BlockOff[]>;
  findById(id: string): Promise<BlockOff | null>;
  create(blockOff: BlockOff): Promise<BlockOff>;
  delete(id: string): Promise<void>;
}

export interface ServiceDurationRuleRepository {
  listActive(query?: ServiceDurationRuleLookupQuery): Promise<ServiceDurationRule[]>;
  findBestMatch(input: DurationInput): Promise<ServiceDurationRule | null>;
  findById(id: string): Promise<ServiceDurationRule | null>;
  update(id: string, patch: Partial<ServiceDurationRule>): Promise<ServiceDurationRule>;
}

export interface AuditLogRepository {
  saveAuditEntry(entry: AuditLogEntry): Promise<AuditLogEntry>;
  listByEntity(entityType: AuditLogEntry["entityType"], entityId: string): Promise<AuditLogEntry[]>;
}

export interface RepositoryBackedAvailabilityContext {
  query: AvailabilityQuery;
  bookings: Booking[];
  temporaryHolds: TemporaryHold[];
  schedules: StaffWorkingSchedule[];
  blockOffs: BlockOff[];
  staffMembers: Staff[];
}
