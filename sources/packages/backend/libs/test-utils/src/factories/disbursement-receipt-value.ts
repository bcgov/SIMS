import { DisbursementReceipt, DisbursementReceiptValue } from "@sims/sims-db";

/**
 * Create fake disbursement receipt value.
 * @param relations dependencies.
 * - `disbursementReceipt` related disbursement receipt.
 * @param options options
 * - `grantType` type of grant to be created.
 * - `grantAmount` grant amount to be created.
 * @returns disbursement receipt value.
 */
export function createFakeDisbursementReceiptValue(
  relations: {
    disbursementReceipt: DisbursementReceipt;
  },
  options: {
    grantType: string;
    grantAmount: number;
  },
): DisbursementReceiptValue {
  const disbursementReceiptValue = new DisbursementReceiptValue();
  disbursementReceiptValue.grantType = options.grantType;
  disbursementReceiptValue.grantAmount = options.grantAmount;
  disbursementReceiptValue.disbursementReceipt = relations.disbursementReceipt;
  return disbursementReceiptValue;
}
