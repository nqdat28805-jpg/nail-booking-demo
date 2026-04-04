import type {
  AvailabilityQuery,
  AvailabilityResult,
  DurationEstimate,
  DurationInput,
} from "@/src/domain/availability/types";

export interface AvailabilityServiceContract {
  estimateDuration(input: DurationInput): Promise<DurationEstimate>;
  queryAvailability(input: AvailabilityQuery): Promise<AvailabilityResult>;
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
