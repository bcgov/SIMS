import {
  CASInvoiceBatchApprovalStatus,
  CASInvoiceStatus,
  OfferingIntensity,
} from "@/types";

export interface CASInvoiceBatchAPIOutDTO {
  id: number;
  batchName: string;
  batchDate: string;
  approvalStatus: CASInvoiceBatchApprovalStatus;
  approvalStatusUpdatedOn: Date;
  approvalStatusUpdatedBy: string;
}

export interface UpdateCASInvoiceBatchAPIInDTO {
  approvalStatus: CASInvoiceBatchApprovalStatus;
}

/**
 * Total amount of a CAS invoice batch for an award.
 */
export interface CASInvoiceBatchAwardAmountAPIOutDTO {
  awardValueCode: string;
  offeringIntensity: OfferingIntensity;
  operationCode: string;
  total: number;
}

/**
 * Count of CAS invoices in a batch for an invoice status.
 */
export interface CASInvoiceStatusCountAPIOutDTO {
  invoiceStatus: CASInvoiceStatus;
  count: number;
}

/**
 * Count of CAS invoices in a batch for each invoice status.
 */
export interface CASInvoiceBatchProcessingSummaryAPIOutDTO {
  totalInvoices: number;
  invoiceStatusCounts: CASInvoiceStatusCountAPIOutDTO[];
}

/**
 * Summary totals of a CAS invoice batch, including processing summary and award amounts.
 */
export interface CASInvoiceBatchSummaryTotalsAPIOutDTO {
  processingSummary: CASInvoiceBatchProcessingSummaryAPIOutDTO;
  awardAmounts: CASInvoiceBatchAwardAmountAPIOutDTO[];
}
