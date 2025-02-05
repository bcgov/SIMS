import {
  CASDistributionAccount,
  CASInvoice,
  CASInvoiceDetail,
  User,
} from "@sims/sims-db";

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
