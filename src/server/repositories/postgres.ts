import type { Sql } from "postgres";
import type { DurationInput, TemporaryHold } from "@/src/domain/availability/types";
import type { AuditLogEntry, Booking } from "@/src/domain/booking/types";
import type { ServiceDurationRule } from "@/src/domain/config/types";
import type { Customer } from "@/src/domain/customer/types";
import type {
  AuditLogRepository,
  BlockOffRepository,
  BookingRepository,
  CustomerRepository,
  ServiceDurationRuleRepository,
  StaffRepository,
  StaffScheduleRepository,
} from "@/src/domain/repositories/contracts";
import type { BlockOff, Staff, StaffWorkingSchedule } from "@/src/domain/staff/types";

export class PostgresBookingRepository implements BookingRepository {
  constructor(private readonly sql: Sql) {}

  async findById(id: string) {
    const [row] = await this.sql<any[]>`select * from bookings where id = ${id} limit 1`;
    return row ? mapBookingRow(row) : null;
  }

  async findByReferenceAndPhone(referenceCode: string, phoneE164: string) {
    const [row] = await this.sql<any[]>`
      select * from bookings
      where reference_code = ${referenceCode}
        and customer_phone_normalized = ${phoneE164}
      limit 1
    `;
    return row ? mapBookingRow(row) : null;
  }

  async create(booking: Booking) {
    await this.sql`
      insert into bookings (
        id, reference_code, shop_id, branch_id, customer_name, customer_phone_normalized, customer_phone_display,
        date, start_time, estimated_duration_minutes, estimated_end_time, guest_count, set_type, nail_type,
        polish_style, effects, notes, source, booking_channel, status, assigned_staff_id, staff_mode,
        payment_method, payment_status, payment_detail_label, payment_detail_value, service_label, created_at, updated_at
      ) values (
        ${booking.id},
        ${booking.referenceCode},
        ${booking.shopId ?? null},
        ${booking.branchId ?? null},
        ${booking.customerSnapshot.fullName},
        ${booking.customerSnapshot.phoneE164},
        ${booking.customerSnapshot.phoneDisplay ?? null},
        ${booking.date},
        ${booking.startTime},
        ${booking.durationMinutes},
        ${booking.estimatedEndTime},
        ${booking.guestCount},
        ${booking.setType},
        ${booking.nailType},
        ${booking.polishStyle},
        ${this.sql.json(booking.effects)},
        ${booking.notes ?? null},
        ${booking.source},
        ${booking.channel},
        ${booking.status},
        ${booking.assignedStaffId ?? null},
        ${booking.assignedStaffMode},
        ${booking.paymentSummary?.method ?? null},
        ${booking.paymentSummary?.status ?? null},
        ${booking.paymentSummary?.detailLabel ?? null},
        ${booking.paymentSummary?.detailValue ?? null},
        ${booking.pricingSummary?.serviceDisplayLabel ?? null},
        ${booking.timestamps.createdAt},
        ${booking.timestamps.updatedAt}
      )
    `;
    return booking;
  }

  async update(id: string, patch: Partial<Booking>) {
    const current = await this.findById(id);
    if (!current) {
      throw new Error(`Booking ${id} not found.`);
    }

    const next = {
      ...current,
      ...patch,
      timestamps: {
        ...current.timestamps,
        ...(patch.timestamps ?? {}),
      },
      paymentSummary: patch.paymentSummary ?? current.paymentSummary ?? null,
      pricingSummary: patch.pricingSummary ?? current.pricingSummary ?? null,
    };

    await this.sql`
      update bookings
      set
        shop_id = ${next.shopId ?? null},
        branch_id = ${next.branchId ?? null},
        customer_name = ${next.customerSnapshot.fullName},
        customer_phone_normalized = ${next.customerSnapshot.phoneE164},
        customer_phone_display = ${next.customerSnapshot.phoneDisplay ?? null},
        date = ${next.date},
        start_time = ${next.startTime},
        estimated_duration_minutes = ${next.durationMinutes},
        estimated_end_time = ${next.estimatedEndTime},
        guest_count = ${next.guestCount},
        set_type = ${next.setType},
        nail_type = ${next.nailType},
        polish_style = ${next.polishStyle},
        effects = ${this.sql.json(next.effects)},
        notes = ${next.notes ?? null},
        source = ${next.source},
        booking_channel = ${next.channel},
        status = ${next.status},
        assigned_staff_id = ${next.assignedStaffId ?? null},
        staff_mode = ${next.assignedStaffMode},
        payment_method = ${next.paymentSummary?.method ?? null},
        payment_status = ${next.paymentSummary?.status ?? null},
        payment_detail_label = ${next.paymentSummary?.detailLabel ?? null},
        payment_detail_value = ${next.paymentSummary?.detailValue ?? null},
        service_label = ${next.pricingSummary?.serviceDisplayLabel ?? null},
        updated_at = ${next.timestamps.updatedAt}
      where id = ${id}
    `;

    return next;
  }

  async listByDateRange(query: {
    branchId?: string | null;
    dateFrom: string;
    dateTo: string;
    staffIds?: string[];
    statuses?: string[];
  }) {
    const rows = await this.sql<any[]>`
      select * from bookings
      where date >= ${query.dateFrom}
        and date <= ${query.dateTo}
        and (${query.branchId ?? null} is null or branch_id = ${query.branchId ?? null})
        and (${query.staffIds?.length ? this.sql.array(query.staffIds) : null} is null or assigned_staff_id = any(${query.staffIds?.length ? this.sql.array(query.staffIds) : this.sql.array(["__none__"]) }))
        and (${query.statuses?.length ? this.sql.array(query.statuses) : null} is null or status = any(${query.statuses?.length ? this.sql.array(query.statuses) : this.sql.array(["__none__"]) }))
    `;
    return rows.map(mapBookingRow);
  }

  async listByStaffAndDate(staffId: string, date: string) {
    const rows = await this.sql<any[]>`
      select * from bookings
      where assigned_staff_id = ${staffId}
        and date = ${date}
    `;
    return rows.map(mapBookingRow);
  }

  async listActiveTemporaryHolds() {
    return [] as TemporaryHold[];
  }

  async saveTemporaryHold(hold: TemporaryHold): Promise<TemporaryHold> {
    void hold;
    throw new Error("TEMP_HOLD persistence is still mocked in the Postgres MVP foundation.");
  }

  async updateTemporaryHold(
    id: string,
    patch: Partial<TemporaryHold>,
  ): Promise<TemporaryHold> {
    void id;
    void patch;
    throw new Error("TEMP_HOLD persistence is still mocked in the Postgres MVP foundation.");
  }
}

export class PostgresStaffRepository implements StaffRepository {
  constructor(private readonly sql: Sql) {}

  async findById(id: string) {
    const [row] = await this.sql<any[]>`select * from staff where id = ${id} limit 1`;
    return row ? mapStaffRow(row) : null;
  }

  async listActive(query?: { branchId?: string | null; ids?: string[]; activeOnly?: boolean }) {
    const rows = await this.sql<any[]>`
      select * from staff
      where (${query?.branchId ?? null} is null or branch_id = ${query?.branchId ?? null})
        and (${query?.ids?.length ? this.sql.array(query.ids) : null} is null or id = any(${query?.ids?.length ? this.sql.array(query.ids) : this.sql.array(["__none__"])}))
        and (${query?.activeOnly === false ? true : false} = true or is_active = true)
      order by sort_order asc, display_name asc
    `;
    return rows.map(mapStaffRow);
  }

  async create(staff: Staff) {
    await this.sql`
      insert into staff (
        id, branch_id, display_name, initials, is_active, sort_order, role, created_at, updated_at
      ) values (
        ${staff.id},
        ${staff.branchId ?? null},
        ${staff.displayName},
        ${staff.initials},
        ${staff.active},
        ${staff.sortOrder ?? 0},
        ${staff.role ?? "staff"},
        ${staff.createdAt},
        ${staff.updatedAt}
      )
    `;
    return staff;
  }

  async update(id: string, patch: Partial<Staff>) {
    const current = await this.findById(id);

    if (!current) {
      throw new Error(`Staff ${id} not found.`);
    }

    const next = {
      ...current,
      ...patch,
      updatedAt: patch.updatedAt ?? current.updatedAt,
    };

    await this.sql`
      update staff
      set
        branch_id = ${next.branchId ?? null},
        display_name = ${next.displayName},
        initials = ${next.initials},
        is_active = ${next.active},
        sort_order = ${next.sortOrder ?? 0},
        role = ${next.role ?? "staff"},
        updated_at = ${next.updatedAt}
      where id = ${id}
    `;

    return next;
  }
}

export class PostgresStaffScheduleRepository implements StaffScheduleRepository {
  constructor(private readonly sql: Sql) {}

  async listByDateRange(query: {
    branchId?: string | null;
    dateFrom: string;
    dateTo: string;
    staffIds?: string[];
  }) {
    const rows = await this.sql<any[]>`
      select * from staff_working_schedules
      where (${query.branchId ?? null} is null or branch_id = ${query.branchId ?? null})
        and (${query.staffIds?.length ? this.sql.array(query.staffIds) : null} is null or staff_id = any(${query.staffIds?.length ? this.sql.array(query.staffIds) : this.sql.array(["__none__"])}))
        and (effective_from is null or effective_from <= ${query.dateTo})
        and (effective_to is null or effective_to >= ${query.dateFrom})
      order by staff_id asc, weekday asc
    `;
    return rows.map(mapScheduleRow);
  }

  async replaceForStaff(staffId: string, schedules: StaffWorkingSchedule[]) {
    const template = schedules[0] ?? null;
    const targetEffectiveFrom = template?.effectiveFrom ?? null;
    const targetEffectiveTo = template?.effectiveTo ?? null;

    await this.sql`
      delete from staff_working_schedules
      where staff_id = ${staffId}
        and (
          (${targetEffectiveFrom}::date is null and effective_from is null)
          or effective_from = ${targetEffectiveFrom}
        )
        and (
          (${targetEffectiveTo}::date is null and effective_to is null)
          or effective_to = ${targetEffectiveTo}
        )
    `;

    for (const schedule of schedules) {
      await this.sql`
        insert into staff_working_schedules (
          id, staff_id, branch_id, weekday, start_time, end_time, break_ranges, is_off, timezone, effective_from, effective_to, created_at, updated_at
        ) values (
          ${schedule.id},
          ${schedule.staffId},
          ${schedule.branchId ?? null},
          ${schedule.dayOfWeek},
          ${schedule.startTime},
          ${schedule.endTime},
          ${this.sql.json((schedule.breakRanges ?? []) as any)},
          ${!schedule.isWorkingDay},
          ${schedule.timezone},
          ${schedule.effectiveFrom ?? null},
          ${schedule.effectiveTo ?? null},
          ${schedule.createdAt},
          ${schedule.updatedAt}
        )
      `;
    }

    return schedules.sort((left, right) => left.dayOfWeek - right.dayOfWeek);
  }
}

export class PostgresBlockOffRepository implements BlockOffRepository {
  constructor(private readonly sql: Sql) {}

  async listActive(query: {
    branchId?: string | null;
    dateFrom: string;
    dateTo: string;
    staffIds?: string[];
    scopes?: string[];
    activeOnly?: boolean;
  }) {
    const rows = await this.sql<any[]>`
      select * from block_off
      where date >= ${query.dateFrom}
        and date <= ${query.dateTo}
        and (${query.branchId ?? null} is null or branch_id = ${query.branchId ?? null})
        and (${query.staffIds?.length ? this.sql.array(query.staffIds) : null} is null or staff_id is null or staff_id = any(${query.staffIds?.length ? this.sql.array(query.staffIds) : this.sql.array(["__none__"])}))
        and (${query.scopes?.length ? this.sql.array(query.scopes) : null} is null or scope = any(${query.scopes?.length ? this.sql.array(query.scopes) : this.sql.array(["__none__"])}))
    `;
    return rows.map(mapBlockOffRow);
  }

  async findById(id: string) {
    const [row] = await this.sql<any[]>`select * from block_off where id = ${id} limit 1`;
    return row ? mapBlockOffRow(row) : null;
  }

  async create(blockOff: BlockOff) {
    const startDate = new Date(blockOff.startAt);
    const endDate = new Date(blockOff.endAt);

    await this.sql`
      insert into block_off (
        id, branch_id, scope, staff_id, date, start_time, end_time, reason, created_at, updated_at
      ) values (
        ${blockOff.id},
        ${blockOff.branchId ?? null},
        ${blockOff.scope === "branch" ? "salon" : blockOff.scope},
        ${blockOff.staffId ?? null},
        ${toIsoDate(startDate)},
        ${toTime(startDate)},
        ${toTime(endDate)},
        ${blockOff.reason ?? blockOff.title},
        ${blockOff.createdAt},
        ${blockOff.updatedAt}
      )
    `;

    return blockOff;
  }

  async delete(id: string) {
    await this.sql`delete from block_off where id = ${id}`;
  }
}

export class PostgresServiceDurationRuleRepository
  implements ServiceDurationRuleRepository
{
  constructor(private readonly sql: Sql) {}

  async listActive(query?: { branchId?: string | null; activeOnly?: boolean }) {
    const rows = await this.sql<any[]>`
      select * from service_duration_rules
      where (${query?.branchId ?? null} is null or branch_id = ${query?.branchId ?? null})
        and (${query?.activeOnly === false ? true : false} = true or is_active = true)
      order by code asc
    `;
    return rows.map(mapDurationRuleRow);
  }

  async findBestMatch(input: DurationInput) {
    const [row] = await this.sql<any[]>`
      select * from service_duration_rules
      where is_active = true
        and (${input.branchId ?? null} is null or branch_id = ${input.branchId ?? null})
        and set_type = ${input.setType}
        and nail_type = ${input.nailType}
        and polish_style = ${input.polishStyle}
        and (effect_option = 'any' or effect_option = any(${this.sql.array(input.effects as string[])}))
      order by case when effect_option = 'any' then 1 else 0 end asc
      limit 1
    `;
    return row ? mapDurationRuleRow(row) : null;
  }

  async findById(id: string) {
    const [row] =
      await this.sql<any[]>`select * from service_duration_rules where id = ${id} limit 1`;
    return row ? mapDurationRuleRow(row) : null;
  }

  async update(id: string, patch: Partial<ServiceDurationRule>) {
    const current = await this.findById(id);

    if (!current) {
      throw new Error(`Duration rule ${id} not found.`);
    }

    const next = {
      ...current,
      ...patch,
      updatedAt: patch.updatedAt ?? current.updatedAt,
    };

    await this.sql`
      update service_duration_rules
      set
        branch_id = ${next.branchId ?? null},
        code = ${next.code},
        set_type = ${next.setType},
        nail_type = ${next.nailType},
        polish_style = ${next.polishStyle},
        effect_option = ${next.effectOption},
        base_duration_minutes = ${next.baseDurationMinutes},
        guest_count_strategy = ${next.guestCountStrategy},
        guest_count_multiplier = ${next.guestCountMultiplier},
        block_round_to_minutes = ${next.blockRoundToMinutes},
        is_active = ${next.active},
        notes = ${next.notes ?? null},
        updated_at = ${next.updatedAt}
      where id = ${id}
    `;

    return next;
  }
}

export class NullCustomerRepository implements CustomerRepository {
  async findById() { return null; }
  async findByPhoneE164() { return null; }
  async create(customer: Customer) { return customer; }
  async update(_id: string, patch: Partial<Customer>) {
    return {
      id: "customer-placeholder",
      fullName: patch.fullName ?? "Customer",
      phoneE164: patch.phoneE164 ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  async search() { return []; }
}

export class NullAuditLogRepository implements AuditLogRepository {
  async saveAuditEntry(entry: AuditLogEntry) { return entry; }
  async listByEntity() { return []; }
}

function mapStaffRow(row: any): Staff {
  return {
    id: row.id,
    displayName: row.display_name,
    initials: row.initials,
    branchId: row.branch_id,
    active: row.is_active,
    sortOrder: row.sort_order,
    role: row.role ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapScheduleRow(row: any): StaffWorkingSchedule {
  return {
    id: row.id,
    staffId: row.staff_id,
    branchId: row.branch_id,
    dayOfWeek: row.weekday,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    breakRanges: Array.isArray(row.break_ranges) ? row.break_ranges : [],
    isWorkingDay: !row.is_off,
    timezone: row.timezone,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBlockOffRow(row: any): BlockOff {
  return {
    id: row.id,
    branchId: row.branch_id,
    staffId: row.staff_id,
    scope: row.scope === "salon" ? "branch" : row.scope,
    title: row.reason ?? "Block off",
    reason: row.reason,
    startAt: `${row.date}T${row.start_time.slice(0, 8)}+07:00`,
    endAt: `${row.date}T${row.end_time.slice(0, 8)}+07:00`,
    active: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDurationRuleRow(row: any): ServiceDurationRule {
  return {
    id: row.id,
    code: row.code,
    branchId: row.branch_id,
    setType: row.set_type,
    nailType: row.nail_type,
    polishStyle: row.polish_style,
    effectOption: row.effect_option,
    baseDurationMinutes: row.base_duration_minutes,
    guestCountStrategy: row.guest_count_strategy,
    guestCountMultiplier: Number(row.guest_count_multiplier),
    blockRoundToMinutes: row.block_round_to_minutes,
    active: row.is_active,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBookingRow(row: any): Booking {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    shopId: row.shop_id,
    customerId: null,
    customerSnapshot: {
      fullName: row.customer_name,
      phoneE164: row.customer_phone_normalized,
      phoneDisplay: row.customer_phone_display,
    },
    anonymousSessionId: null,
    branchId: row.branch_id,
    date: row.date,
    startTime: row.start_time.slice(0, 5),
    estimatedEndTime: row.estimated_end_time.slice(0, 5),
    durationMinutes: row.estimated_duration_minutes,
    guestCount: row.guest_count,
    setType: row.set_type,
    nailType: row.nail_type,
    polishStyle: row.polish_style,
    effects: Array.isArray(row.effects) ? row.effects : [],
    notes: row.notes,
    source: row.source,
    channel: row.booking_channel,
    status: row.status,
    assignedStaffMode: row.staff_mode,
    assignedStaffId: row.assigned_staff_id,
    pricingSummary: row.service_label
      ? {
          shopId: row.shop_id,
          priceListId: null,
          serviceDisplayLabel: row.service_label,
          quotedSubtotalLabel: null,
          quotedTotalLabel: null,
          currency: "VND",
        }
      : null,
    paymentSummary: row.payment_method
      ? {
          method: row.payment_method,
          status: row.payment_status ?? "payment_not_started",
          detailLabel: row.payment_detail_label,
          detailValue: row.payment_detail_value,
          capturedAt: null,
        }
      : null,
    timestamps: {
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      confirmedAt: null,
      checkedInAt: null,
      actualCompletedAt: null,
      cancelledAt: null,
    },
    auditMetadata: {
      createdByActorType: "system",
      createdByActorId: "postgres-repo",
      updatedByActorType: "system",
      updatedByActorId: "postgres-repo",
    },
  };
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}
