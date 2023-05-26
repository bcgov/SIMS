import { DisbursementReceipt, DisbursementReceiptValue } from "@sims/sims-db";

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
