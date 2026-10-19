import { CASInvoiceStatus, OfferingIntensity } from "@sims/sims-db";

export interface CASInvoiceBatchReport {
  batchName: string;
  batchDate: Date;
  reportCSVContent: string;
}

/**
 * Total amount of a CAS invoice batch for a award.
 */
export interface CASInvoiceBatchAwardAmount {
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

/**
 * Count of CAS invoices in a batch for each invoice status.
 */
export interface CASInvoiceBatchProcessingSummary {
  totalInvoices: number;
  invoiceStatusCounts: CASInvoiceStatusCount[];
}
