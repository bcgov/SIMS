import {
  CASInvoiceBatchApprovalStatus,
  CASInvoiceStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import { IsIn } from "class-validator";

export class CASInvoiceBatchAPIOutDTO {
  id: number;
  batchName: string;
  batchDate: Date;
  approvalStatus: CASInvoiceBatchApprovalStatus;
  approvalStatusUpdatedOn: Date;
  approvalStatusUpdatedBy: string;
}

export class UpdateCASInvoiceBatchAPIInDTO {
  @IsIn([
    CASInvoiceBatchApprovalStatus.Approved,
    CASInvoiceBatchApprovalStatus.Rejected,
  ])
  approvalStatus:
    | CASInvoiceBatchApprovalStatus.Approved
    | CASInvoiceBatchApprovalStatus.Rejected;
}

/**
 * Total amount in a CAS invoice batch for a distribution type.
 */
export class CASInvoiceBatchDistributionTypeAmountAPIOutDTO {
  awardValueCode: string;
  offeringIntensity: OfferingIntensity;
  operationCode: string;
  total: number;
}

/**
 * Count of CAS invoices in a batch for an invoice status.
 */
export class CASInvoiceStatusCountAPIOutDTO {
  invoiceStatus: CASInvoiceStatus;
  count: number;
}

/**
 * Total and per-status count of CAS invoices in a batch.
 */
export class CASInvoiceBatchProcessingSummaryAPIOutDTO {
  totalInvoices: number;
  invoiceStatusCounts: CASInvoiceStatusCountAPIOutDTO[];
}

/**
 * Summary totals of a CAS invoice batch, including processing summary and distribution type amounts.
 */
export class CASInvoiceBatchSummaryTotalsAPIOutDTO {
  processingSummary: CASInvoiceBatchProcessingSummaryAPIOutDTO;
  distributionTypeAmounts: CASInvoiceBatchDistributionTypeAmountAPIOutDTO[];
}
