import { DisbursementReceipt, DisbursementReceiptValue } from "@sims/sims-db";
import { faker } from "@faker-js/faker";

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
    initialValues.grantType ?? faker.string.alpha({ length: 4 });
  disbursementReceiptValue.grantAmount =
    initialValues.grantAmount ??
    faker.number.int({
      min: 1000,
      max: 9999,
    });
  disbursementReceiptValue.disbursementReceipt = relations.disbursementReceipt;
  return disbursementReceiptValue;
}
