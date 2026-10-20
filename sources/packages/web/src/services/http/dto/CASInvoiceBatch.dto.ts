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
 * Total amount in a CAS invoice batch for a distribution type.
 */
export interface CASInvoiceBatchDistributionTypeAmountAPIOutDTO {
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
 * Total and per-status count of CAS invoices in a batch.
 */
export interface CASInvoiceBatchProcessingSummaryAPIOutDTO {
  totalInvoices: number;
  invoiceStatusCounts: CASInvoiceStatusCountAPIOutDTO[];
}

/**
 * Summary totals of a CAS invoice batch, including processing summary and distribution type amounts.
 */
export interface CASInvoiceBatchSummaryTotalsAPIOutDTO {
  processingSummary: CASInvoiceBatchProcessingSummaryAPIOutDTO;
  distributionTypeAmounts: CASInvoiceBatchDistributionTypeAmountAPIOutDTO[];
}
