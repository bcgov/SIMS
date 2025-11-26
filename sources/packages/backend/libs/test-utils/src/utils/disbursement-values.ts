import { DisbursementValue, DisbursementValueType } from "@sims/sims-db";

/**
 * Sum disbursement value amounts, optionally filtering by value code.
 * When not filtering by value code, sums all disbursement value amounts
 * excluding the 'BC Total Grant' value type, which should represent
 * the total amount to be paid for the student.
 * @param disbursementValues disbursement values to sum.
 * @param valueCode optional value code to filter by.
 * @returns sum of the disbursement value amounts.
 */
export function sumAwardAmounts(
  disbursementValues: Pick<
    DisbursementValue,
    "valueType" | "valueCode" | "valueAmount"
  >[],
  valueCode?: string,
): number {
  return disbursementValues
    .filter(
      (award) =>
        award.valueType !== DisbursementValueType.BCTotalGrant &&
        (!valueCode || award.valueCode === valueCode),
    )
    .reduce((sum, award) => sum + award.valueAmount, 0);
}
