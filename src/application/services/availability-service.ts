import type {
  AvailabilityQuery,
  AvailabilityResult,
  DurationInput,
} from "@/src/domain/availability/types";
import { runAvailabilityEngine } from "@/src/domain/availability/engine";
import type { AvailabilityServiceContract } from "@/src/domain/availability/contracts";
import type {
  BlockOffRepository,
  BookingRepository,
  StaffRepository,
  StaffScheduleRepository,
} from "@/src/domain/repositories/contracts";
import type { DurationService } from "@/src/application/services/duration-service";

export interface AvailabilityServiceDependencies {
  bookingRepository: BookingRepository;
  staffRepository: StaffRepository;
  staffScheduleRepository: StaffScheduleRepository;
  blockOffRepository: BlockOffRepository;
  durationService: DurationService;
  businessHours: {
    openTime: string;
    closeTime: string;
  };
  now?: () => Date;
}

export class DefaultAvailabilityService implements AvailabilityServiceContract {
  constructor(private readonly dependencies: AvailabilityServiceDependencies) {}

  async estimateDuration(input: DurationInput, startTime?: string | null) {
    return this.dependencies.durationService.estimateDuration(input, startTime);
  }

  async queryAvailability(input: AvailabilityQuery): Promise<AvailabilityResult> {
    const estimate = await this.dependencies.durationService.estimateDuration(
      input.durationInput,
    );
    const staffMembers =
      input.staffAssignmentMode === "specific_staff" && input.requestedStaffId
        ? [
            await this.dependencies.staffRepository.findById(
              input.requestedStaffId,
            ),
          ].filter(
            (staff): staff is NonNullable<typeof staff> =>
              Boolean(staff?.active),
          )
        : await this.dependencies.staffRepository.listActive({
            branchId: input.branchId ?? null,
            activeOnly: true,
          });
    const staffIds = staffMembers.map((staff) => staff.id);
    const [bookings, temporaryHolds, schedules, blockOffs] = await Promise.all([
      this.dependencies.bookingRepository.listByDateRange({
        branchId: input.branchId ?? null,
        dateFrom: input.date,
        dateTo: input.date,
        staffIds,
      }),
      this.dependencies.bookingRepository.listActiveTemporaryHolds({
        branchId: input.branchId ?? null,
        date: input.date,
        staffIds,
        statuses: ["active"],
      }),
      this.dependencies.staffScheduleRepository.listByDateRange({
        branchId: input.branchId ?? null,
        dateFrom: input.date,
        dateTo: input.date,
        staffIds,
      }),
      this.dependencies.blockOffRepository.listActive({
        branchId: input.branchId ?? null,
        dateFrom: input.date,
        dateTo: input.date,
        staffIds,
        activeOnly: true,
      }),
    ]);

    return runAvailabilityEngine({
      query: input,
      estimate,
      staffMembers,
      schedules,
      bookings,
      blockOffs,
      temporaryHolds,
      businessHours: this.dependencies.businessHours,
      now: this.dependencies.now?.() ?? new Date(),
      collapseContinuationStates: true,
    });
  }
}
