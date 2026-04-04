import type {
  DurationEstimate,
  DurationInput,
} from "@/src/domain/availability/types";
import type { EffectOption } from "@/src/domain/booking/types";
import type { ServiceDurationRule } from "@/src/domain/config/types";
import type { ServiceDurationRuleRepository } from "@/src/domain/repositories/contracts";

export interface DurationService {
  estimateDuration(input: DurationInput, startTime?: string | null): Promise<DurationEstimate>;
}

export interface DurationServiceOptions {
  effectExtraMinutes?: Partial<Record<Exclude<EffectOption, "none">, number>>;
  fallbackDurationMinutes?: number;
  defaultSlotIntervalMinutes?: number;
}

export class DefaultDurationService implements DurationService {
  constructor(
    private readonly durationRuleRepository: ServiceDurationRuleRepository,
    private readonly options: DurationServiceOptions = {},
  ) {}

  async estimateDuration(input: DurationInput, startTime?: string | null) {
    const matchedRule = await this.durationRuleRepository.findBestMatch(input);

    return estimateDurationFromRules({
      input,
      matchedRule,
      startTime,
      effectExtraMinutes: this.options.effectExtraMinutes,
      fallbackDurationMinutes: this.options.fallbackDurationMinutes,
      defaultSlotIntervalMinutes: this.options.defaultSlotIntervalMinutes,
    });
  }
}

export function estimateDurationFromRules(input: {
  input: DurationInput;
  matchedRule?: ServiceDurationRule | null;
  rules?: ServiceDurationRule[];
  startTime?: string | null;
  effectExtraMinutes?: Partial<Record<Exclude<EffectOption, "none">, number>>;
  fallbackDurationMinutes?: number;
  defaultSlotIntervalMinutes?: number;
}): DurationEstimate {
  const matchedRule =
    input.matchedRule ??
    input.rules?.find(
      (rule) =>
        rule.active &&
        rule.setType === input.input.setType &&
        rule.nailType === input.input.nailType &&
        rule.polishStyle === input.input.polishStyle,
    ) ??
    null;
  const effectMinutesMap = {
    sticker: 15,
    design: 30,
    ...input.effectExtraMinutes,
  };
  const slotIntervalMinutes =
    matchedRule?.blockRoundToMinutes ?? input.defaultSlotIntervalMinutes ?? 30;
  const baseDurationMinutes =
    matchedRule?.baseDurationMinutes ?? input.fallbackDurationMinutes ?? 60;
  const activeEffects = input.input.effects.filter((effect) => effect !== "none");
  const effectMinutes = activeEffects.reduce((total, effect) => {
    return total + (effectMinutesMap[effect] ?? 0);
  }, 0);
  const guestScale =
    matchedRule?.guestCountStrategy === "parallel"
      ? Math.max(1, matchedRule.guestCountMultiplier)
      : input.input.guestCount;
  const rawDurationMinutes =
    (baseDurationMinutes + effectMinutes) * guestScale;
  const blockedDurationMinutes = roundUpToNearest(
    rawDurationMinutes,
    slotIntervalMinutes,
  );

  return {
    durationMinutes: blockedDurationMinutes,
    blockedDurationMinutes,
    slotIntervalMinutes,
    estimatedEndTime: input.startTime
      ? addMinutesToTime(input.startTime, blockedDurationMinutes)
      : null,
    matchedRuleCodes: matchedRule ? [matchedRule.code] : ["draft-fallback-rule"],
    notes: [
      matchedRule
        ? "Matched shared service duration rule."
        : "TODO: replace fallback duration with persisted service duration rule.",
      input.input.processingStrategy === "parallel"
        ? "TODO: implement true parallel guest duration handling."
        : "Guest count currently scales sequentially in the demo runtime.",
    ],
  };
}

function roundUpToNearest(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const normalizedHours = Math.floor(totalMinutes / 60);
  const normalizedMinutes = totalMinutes % 60;

  return `${String(normalizedHours).padStart(2, "0")}:${String(
    normalizedMinutes,
  ).padStart(2, "0")}`;
}
