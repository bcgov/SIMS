import { CASInvoiceBatchApprovalStatus } from "@sims/sims-db";

export class CASInvoiceBatchAPIOutDTO {
  id: number;
  batchName: string;
  batchDate: string;
  approvalStatus: CASInvoiceBatchApprovalStatus;
  approvalStatusUpdatedOn: Date;
  approvalStatusUpdatedBy: string;
}

export class CASInvoiceBatchesAPIOutDTO {
  batches: CASInvoiceBatchAPIOutDTO[];
}
