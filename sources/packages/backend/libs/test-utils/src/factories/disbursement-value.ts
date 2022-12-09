import {
  DisbursementSchedule,
  DisbursementValue,
  DisbursementValueType,
} from "@sims/sims-db";

export function createFakeDisbursementValue(
  valueType: DisbursementValueType,
  valueCode: string,
  valueAmount: string,
  overawardAmountSubtracted?: string,
  disbursedAmountSubtracted?: string,
  relations?: {
    disbursementSchedule: DisbursementSchedule;
  },
): DisbursementValue {
  const disbursementValue = new DisbursementValue();
  disbursementValue.valueType = valueType;
  disbursementValue.valueCode = valueCode;
  disbursementValue.valueAmount = valueAmount;
  disbursementValue.overawardAmountSubtracted = overawardAmountSubtracted;
  disbursementValue.disbursedAmountSubtracted = disbursedAmountSubtracted;
  disbursementValue.disbursementSchedule = relations?.disbursementSchedule;
  return disbursementValue;
}
