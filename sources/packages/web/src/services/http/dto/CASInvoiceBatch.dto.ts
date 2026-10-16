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

export interface CASInvoiceBatchAwardAmountAPIOutDTO {
  awardValueCode: string;
  offeringIntensity: OfferingIntensity;
  operationCode: string;
  total: number;
}

export interface CASInvoiceBatchProcessingSummaryAPIOutDTO {
  totalInvoices: number;
  totalPending: number;
  totalSent: number;
  totalManualIntervention: number;
  totalResolved: number;
}

export interface CASInvoiceBatchSummaryTotalsAPIOutDTO {
  processingSummary: CASInvoiceBatchProcessingSummaryAPIOutDTO;
  awardAmounts: CASInvoiceBatchAwardAmountAPIOutDTO[];
}
