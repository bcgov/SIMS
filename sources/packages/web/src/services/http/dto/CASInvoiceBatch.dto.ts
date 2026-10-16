import { CASInvoiceBatchApprovalStatus, OfferingIntensity } from "@/types";

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
 * Total amount of a CAS invoice batch for a award.
 */
export interface CASInvoiceBatchAwardAmountAPIOutDTO {
  awardValueCode: string;
  offeringIntensity: OfferingIntensity;
  operationCode: string;
  total: number;
}

/**
 * Count of CAS invoices in a batch for each invoice status.
 */
export interface CASInvoiceBatchProcessingSummaryAPIOutDTO {
  totalInvoices: number;
  totalPending: number;
  totalSent: number;
  totalManualIntervention: number;
  totalResolved: number;
}

/**
 * Summary totals of a CAS invoice batch, including processing summary and award amounts.
 */
export interface CASInvoiceBatchSummaryTotalsAPIOutDTO {
  processingSummary: CASInvoiceBatchProcessingSummaryAPIOutDTO;
  awardAmounts: CASInvoiceBatchAwardAmountAPIOutDTO[];
}
