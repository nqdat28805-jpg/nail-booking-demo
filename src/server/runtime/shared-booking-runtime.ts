import { DefaultAvailabilityService } from "@/src/application/services/availability-service";
import { DefaultBookingService } from "@/src/application/services/booking-service";
import { DefaultCustomerService } from "@/src/application/services/customer-service";
import { DefaultDurationService } from "@/src/application/services/duration-service";
import type { AuditLogRepository, BlockOffRepository, BookingRepository, CustomerRepository, ServiceDurationRuleRepository, StaffRepository, StaffScheduleRepository } from "@/src/domain/repositories/contracts";
import { createDemoBookingRuntime } from "@/src/infrastructure/memory";
import { getSqlClient, isDatabaseConfigured } from "@/src/server/db/client";
import { ensureDatabaseBootstrap } from "@/src/server/db/schema";
import {
  DEMO_BLOCK_OFFS,
  DEMO_DURATION_RULES,
  DEMO_STAFF,
  DEMO_STAFF_SCHEDULES,
  getDemoSeededBookings,
  getDemoSeededTemporaryHolds,
  getTodayOperationsSeedBookings,
} from "@/src/server/demo/demo-seed";
import {
  NullAuditLogRepository,
  NullCustomerRepository,
  PostgresBlockOffRepository,
  PostgresBookingRepository,
  PostgresServiceDurationRuleRepository,
  PostgresStaffRepository,
  PostgresStaffScheduleRepository,
} from "@/src/server/repositories/postgres";

export type SharedRuntimeSource = "database" | "memory_fallback";

export interface SharedBookingRuntime {
  source: SharedRuntimeSource;
  repositories: {
    bookingRepository: BookingRepository;
    customerRepository: CustomerRepository;
    staffRepository: StaffRepository;
    staffScheduleRepository: StaffScheduleRepository;
    blockOffRepository: BlockOffRepository;
    serviceDurationRuleRepository: ServiceDurationRuleRepository;
    auditLogRepository: AuditLogRepository;
  };
  services: {
    availabilityService: DefaultAvailabilityService;
    durationService: DefaultDurationService;
    bookingService: DefaultBookingService;
    customerService: DefaultCustomerService;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __ki_shared_booking_runtime_promise__: Promise<SharedBookingRuntime> | undefined;
}

export function getSharedBookingRuntime() {
  return ensureSharedBookingRuntime();
}

async function ensureSharedBookingRuntime() {
  if (!global.__ki_shared_booking_runtime_promise__) {
    global.__ki_shared_booking_runtime_promise__ = createSharedBookingRuntime();
  }

  const runtime = await global.__ki_shared_booking_runtime_promise__;

  if (!isRuntimeCompatible(runtime)) {
    global.__ki_shared_booking_runtime_promise__ = createSharedBookingRuntime();
    return global.__ki_shared_booking_runtime_promise__;
  }

  return runtime;
}

async function createSharedBookingRuntime(): Promise<SharedBookingRuntime> {
  if (isDatabaseConfigured()) {
    try {
      const sql = getSqlClient();
      await ensureDatabaseBootstrap(sql);

      const bookingRepository = new PostgresBookingRepository(sql);
      const customerRepository = new NullCustomerRepository();
      const staffRepository = new PostgresStaffRepository(sql);
      const staffScheduleRepository = new PostgresStaffScheduleRepository(sql);
      const blockOffRepository = new PostgresBlockOffRepository(sql);
      const serviceDurationRuleRepository =
        new PostgresServiceDurationRuleRepository(sql);
      const auditLogRepository = new NullAuditLogRepository();
      const customerService = new DefaultCustomerService(customerRepository);
      const durationService = new DefaultDurationService(
        serviceDurationRuleRepository,
        {
          defaultSlotIntervalMinutes: 30,
        },
      );
      const availabilityService = new DefaultAvailabilityService({
        bookingRepository,
        staffRepository,
        staffScheduleRepository,
        blockOffRepository,
        durationService,
        businessHours: {
          openTime: "09:00",
          closeTime: "21:00",
        },
      });
      const bookingService = new DefaultBookingService({
        bookingRepository,
        auditLogRepository,
        customerService,
        durationService,
        availabilityService,
      });

      return {
        source: "database",
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
      };
    } catch (error) {
      console.error("Falling back to in-memory shared booking runtime.", error);
    }
  }

  const runtime = createDemoBookingRuntime({
    branchId: "19nail-main",
    staff: DEMO_STAFF,
    schedules: DEMO_STAFF_SCHEDULES,
    blockOffs: DEMO_BLOCK_OFFS,
    durationRules: DEMO_DURATION_RULES,
    bookings: getTodayOperationsSeedBookings(),
    businessHours: {
      openTime: "09:00",
      closeTime: "21:00",
    },
    slotIntervalMinutes: 30,
    effectExtraMinutes: {
      sticker: 15,
      design: 30,
    },
    seedBookingsByStaffAndDate: ({ staffId, date }) =>
      getDemoSeededBookings(staffId, date),
    seedTemporaryHoldsByStaffAndDate: ({ staffId, date }) =>
      getDemoSeededTemporaryHolds(staffId, date),
  });

  return {
    source: "memory_fallback",
    repositories: runtime.repositories,
    services: runtime.services,
  };
}

function isRuntimeCompatible(runtime: SharedBookingRuntime) {
  return (
    typeof runtime.repositories.staffRepository.create === "function" &&
    typeof runtime.repositories.staffRepository.update === "function" &&
    typeof runtime.repositories.staffScheduleRepository.replaceForStaff === "function" &&
    typeof runtime.repositories.blockOffRepository.create === "function" &&
    typeof runtime.repositories.blockOffRepository.delete === "function" &&
    typeof runtime.repositories.serviceDurationRuleRepository.update === "function"
  );
}
