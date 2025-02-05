import {
  CASDistributionAccount,
  CASInvoice,
  CASInvoiceDetail,
  User,
} from "@sims/sims-db";

/**
 * Creates a fake CAS invoice detail ready to be saved to the database.
 * @param relations dependencies.
 * - `casDistributionAccount` distribution account already saved to
 * the database to be associated with the invoice detail.
 * - `creator` user already saved to the database that will be the creator of the invoice detail.
 * - `casInvoice` invoice already saved to the database to be associated with the
 * invoice detail (optional).
 * @param options options.
 * - `initialValues` CAS invoice detail values.
 * @returns a fake CAS invoice detail.
 */
export function createFakeCASInvoiceDetail(
  relations: {
    casDistributionAccount: CASDistributionAccount;
    creator: User;
    casInvoice?: CASInvoice;
  },
  options?: { initialValues?: Partial<CASInvoiceDetail> },
): CASInvoiceDetail {
  const casInvoiceDetail = new CASInvoiceDetail();
  casInvoiceDetail.casInvoice = relations.casInvoice;
  casInvoiceDetail.casDistributionAccount = relations.casDistributionAccount;
  casInvoiceDetail.valueAmount = options?.initialValues?.valueAmount ?? 0;
  casInvoiceDetail.creator = relations.creator;
  return casInvoiceDetail;
}
