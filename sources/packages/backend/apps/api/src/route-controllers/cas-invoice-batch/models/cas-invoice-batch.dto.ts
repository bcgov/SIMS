import { CASInvoiceBatchApprovalStatus } from "@sims/sims-db";
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
