import type {
  AvailabilityQuery,
  AvailabilityResult,
  DurationEstimate,
  DurationInput,
  TemporaryHold,
} from "@/src/domain/availability/types";

export interface CreateBookingHoldInput {
  date: string;
  startTime: string;
  durationMinutes: number;
  branchId?: string | null;
  requestedStaffId?: string | null;
  createdBySessionId?: string | null;
}

export interface ReleaseBookingHoldInput {
  holdId: string;
  releasedBySessionId?: string | null;
}

export interface AvailabilityServiceContract {
  estimateDuration(input: DurationInput, startTime?: string | null): Promise<DurationEstimate>;
  queryAvailability(input: AvailabilityQuery): Promise<AvailabilityResult>;
  createTemporaryHold?(input: CreateBookingHoldInput): Promise<TemporaryHold>;
  releaseTemporaryHold?(input: ReleaseBookingHoldInput): Promise<void>;
}

export const unimplementedAvailabilityService: AvailabilityServiceContract = {
  async estimateDuration() {
    throw new Error(
      "estimateDuration is a shared backend contract stub. Implement it against the shared availability engine.",
    );
  },
  async queryAvailability() {
    throw new Error(
      "queryAvailability is a shared backend contract stub. Implement it against the shared availability engine.",
    );
  },
};
