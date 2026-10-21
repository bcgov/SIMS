import { CASInvoiceStatus, OfferingIntensity } from "@sims/sims-db";

export interface CASInvoiceBatchReport {
  batchName: string;
  batchDate: Date;
  reportCSVContent: string;
}

/**
 * Total amount in a CAS invoice batch for a distribution type.
 */
export interface CASInvoiceBatchDistributionTypeAmount {
  awardValueCode: string;
  offeringIntensity: OfferingIntensity;
  operationCode: string;
  total: number;
}

/**
 * Count of CAS invoices in a batch for an invoice status.
 */
export interface CASInvoiceStatusCount {
  invoiceStatus: CASInvoiceStatus;
  count: number;
}
