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
 * Total amount of a CAS invoice batch for an award.
 */
export class CASInvoiceBatchAwardAmountAPIOutDTO {
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
 * Count of CAS invoices in a batch for each invoice status.
 */
export class CASInvoiceBatchProcessingSummaryAPIOutDTO {
  totalInvoices: number;
  invoiceStatusCounts: CASInvoiceStatusCountAPIOutDTO[];
}

/**
 * Summary totals of a CAS invoice batch, including processing summary and award amounts.
 */
export class CASInvoiceBatchSummaryTotalsAPIOutDTO {
  processingSummary: CASInvoiceBatchProcessingSummaryAPIOutDTO;
  awardAmounts: CASInvoiceBatchAwardAmountAPIOutDTO[];
}
