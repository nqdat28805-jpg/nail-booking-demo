import { runAvailabilityEngine } from "@/src/domain/availability/engine";
import type {
  AvailabilityQuery,
  DurationInput,
  TemporaryHold,
} from "@/src/domain/availability/types";
import type { Booking, EffectOption } from "@/src/domain/booking/types";
import type { ServiceDurationRule } from "@/src/domain/config/types";
import type { Customer } from "@/src/domain/customer/types";
import type { BlockOff, Staff, StaffWorkingSchedule } from "@/src/domain/staff/types";
import {
  InMemoryAuditLogRepository,
  InMemoryBlockOffRepository,
  InMemoryBookingRepository,
  InMemoryCustomerRepository,
  InMemoryServiceDurationRuleRepository,
  InMemoryStaffRepository,
  InMemoryStaffScheduleRepository,
} from "@/src/infrastructure/memory/repositories";
import { DefaultAvailabilityService } from "@/src/application/services/availability-service";
import { DefaultBookingService } from "@/src/application/services/booking-service";
import { DefaultCustomerService } from "@/src/application/services/customer-service";
import {
  DefaultDurationService,
  estimateDurationFromRules,
} from "@/src/application/services/duration-service";

export interface DemoBookingRuntimeConfig {
  branchId?: string | null;
  staff: Staff[];
  schedules: StaffWorkingSchedule[];
  blockOffs: BlockOff[];
  durationRules: ServiceDurationRule[];
  bookings?: Booking[];
  temporaryHolds?: TemporaryHold[];
  businessHours: {
    openTime: string;
    closeTime: string;
  };
  slotIntervalMinutes: number;
  effectExtraMinutes?: Partial<Record<Exclude<EffectOption, "none">, number>>;
  customers?: Customer[];
  seedBookingsByStaffAndDate?: (input: {
    staffId: string;
    date: string;
  }) => Booking[];
  seedTemporaryHoldsByStaffAndDate?: (input: {
    staffId: string;
    date: string;
  }) => TemporaryHold[];
  now?: () => Date;
}

export function createDemoBookingRuntime(config: DemoBookingRuntimeConfig) {
  const bookingRepository = new InMemoryBookingRepository({
    bookings: config.bookings,
    temporaryHolds: config.temporaryHolds,
    seedBookingsByStaffAndDate: config.seedBookingsByStaffAndDate,
    seedTemporaryHoldsByStaffAndDate: config.seedTemporaryHoldsByStaffAndDate,
  });
  const customerRepository = new InMemoryCustomerRepository(config.customers ?? []);
  const staffRepository = new InMemoryStaffRepository(config.staff);
  const staffScheduleRepository = new InMemoryStaffScheduleRepository(
    config.schedules,
  );
  const blockOffRepository = new InMemoryBlockOffRepository(config.blockOffs);
  const serviceDurationRuleRepository =
    new InMemoryServiceDurationRuleRepository(config.durationRules);
  const auditLogRepository = new InMemoryAuditLogRepository();
  const customerService = new DefaultCustomerService(customerRepository);
  const durationService = new DefaultDurationService(
    serviceDurationRuleRepository,
    {
      effectExtraMinutes: config.effectExtraMinutes,
      defaultSlotIntervalMinutes: config.slotIntervalMinutes,
    },
  );
  const availabilityService = new DefaultAvailabilityService({
    bookingRepository,
    staffRepository,
    staffScheduleRepository,
    blockOffRepository,
    durationService,
    businessHours: config.businessHours,
    now: config.now,
  });
  const bookingService = new DefaultBookingService({
    bookingRepository,
    auditLogRepository,
    customerService,
    durationService,
    availabilityService,
    now: config.now,
  });

  return {
    repositories: {
      bookingRepository,
      customerRepository,
      staffRepository,
      staffScheduleRepository,
      blockOffRepository,
      serviceDurationRuleRepository,
      auditLogRepository,
    },
    services: {
      availabilityService,
      durationService,
      bookingService,
      customerService,
    },
    estimateDurationSync(input: DurationInput, startTime: string | null = null) {
      return estimateDurationFromRules({
        input,
        rules: config.durationRules,
        startTime,
        effectExtraMinutes: config.effectExtraMinutes,
        defaultSlotIntervalMinutes: config.slotIntervalMinutes,
      });
    },
    queryAvailabilitySync(query: AvailabilityQuery) {
      const estimate = estimateDurationFromRules({
        input: query.durationInput,
        rules: config.durationRules,
        effectExtraMinutes: config.effectExtraMinutes,
        defaultSlotIntervalMinutes: config.slotIntervalMinutes,
      });
      const staffMembers =
        query.staffAssignmentMode === "specific_staff" && query.requestedStaffId
          ? config.staff.filter((staff) => staff.id === query.requestedStaffId)
          : config.staff.filter((staff) => staff.active);
      const staffIds = staffMembers.map((staff) => staff.id);
      const bookings = staffIds.flatMap((staffId) =>
        config.seedBookingsByStaffAndDate?.({
          staffId,
          date: query.date,
        }) ?? [],
      );
      const temporaryHolds = staffIds.flatMap((staffId) =>
        config.seedTemporaryHoldsByStaffAndDate?.({
          staffId,
          date: query.date,
        }) ?? [],
      );

      return runAvailabilityEngine({
        query,
        estimate,
        staffMembers,
        schedules: config.schedules,
        bookings,
        blockOffs: config.blockOffs,
        temporaryHolds,
        businessHours: config.businessHours,
        now: config.now?.() ?? new Date(),
        collapseContinuationStates: true,
      });
    },
  };
}
