import { DisbursementReceipt, DisbursementReceiptValue } from "@sims/sims-db";
import faker from "faker";

/**
 * Create fake disbursement receipt value.
 * @param initialValues initial values that need to be assigned
 * while creating a fake disbursement receipt value.
 * @param relations dependencies.
 * - `disbursementReceipt` related disbursement receipt.
 * @returns disbursement receipt value.
 */
export function createFakeDisbursementReceiptValue(
  initialValues: Partial<DisbursementReceiptValue>,
  relations: {
    disbursementReceipt: DisbursementReceipt;
  },
): DisbursementReceiptValue {
  const disbursementReceiptValue = new DisbursementReceiptValue();
  disbursementReceiptValue.grantType =
    initialValues.grantType ?? faker.random.alpha({ count: 4 });
  disbursementReceiptValue.grantAmount =
    initialValues.grantAmount ??
    faker.datatype.number({
      min: 1000,
      max: 9999,
    });
  disbursementReceiptValue.disbursementReceipt = relations.disbursementReceipt;
  return disbursementReceiptValue;
}
