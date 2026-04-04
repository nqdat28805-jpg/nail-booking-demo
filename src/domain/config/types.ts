import type {
  EffectOption,
  NailType,
  PolishStyle,
  SetType,
} from "@/src/domain/booking/types";

export interface ServiceDurationRule {
  id: string;
  code: string;
  branchId?: string | null;
  setType: SetType;
  nailType: NailType;
  polishStyle: PolishStyle;
  effectOption: EffectOption | "any";
  baseDurationMinutes: number;
  guestCountStrategy: "sequential" | "parallel";
  guestCountMultiplier: number;
  blockRoundToMinutes: number;
  active: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
