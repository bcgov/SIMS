import { CASInvoiceBatchApprovalStatus } from "@/types";

export interface CASInvoiceBatchAPIOutDTO {
  id: number;
  batchName: string;
  batchDate: string;
  approvalStatus: CASInvoiceBatchApprovalStatus;
  approvalStatusUpdatedOn: Date;
  approvalStatusUpdatedBy: string;
}

export interface CASInvoiceBatchesAPIOutDTO {
  batches: CASInvoiceBatchAPIOutDTO[];
}
