import { DisbursementReceipt, DisbursementReceiptValue } from "@sims/sims-db";

/**
 * Create fake disbursement receipt value.
 * @param grantType type of grant to be created.
 * @param grantAmount grant amount to be created.
 * @param relations dependencies.
 * - `disbursementReceipt` related disbursement receipt.
 * @returns disbursement receipt value.
 */
export function createFakeDisbursementReceiptValue(
  grantType: string,
  grantAmount: number,
  relations: {
    disbursementReceipt: DisbursementReceipt;
  },
): DisbursementReceiptValue {
  const disbursementReceiptValue = new DisbursementReceiptValue();
  disbursementReceiptValue.grantType = grantType;
  disbursementReceiptValue.grantAmount = grantAmount;
  disbursementReceiptValue.disbursementReceipt = relations.disbursementReceipt;
  return disbursementReceiptValue;
}
