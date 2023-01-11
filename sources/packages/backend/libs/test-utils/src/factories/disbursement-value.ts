import {
  DisbursementSchedule,
  DisbursementValue,
  DisbursementValueType,
} from "@sims/sims-db";

export function createFakeDisbursementValue(
  valueType: DisbursementValueType,
  valueCode: string,
  valueAmount: string,
  options?: {
    overawardAmountSubtracted?: string;
    disbursedAmountSubtracted?: string;
    effectiveAmount?: string;
  },
  relations?: {
    disbursementSchedule: DisbursementSchedule;
  },
): DisbursementValue {
  const disbursementValue = new DisbursementValue();
  disbursementValue.valueType = valueType;
  disbursementValue.valueCode = valueCode;
  disbursementValue.valueAmount = valueAmount;
  disbursementValue.overawardAmountSubtracted =
    options?.overawardAmountSubtracted;
  disbursementValue.disbursedAmountSubtracted =
    options?.disbursedAmountSubtracted;
  disbursementValue.disbursementSchedule = relations?.disbursementSchedule;
  disbursementValue.effectiveAmount = options?.effectiveAmount;
  return disbursementValue;
}
