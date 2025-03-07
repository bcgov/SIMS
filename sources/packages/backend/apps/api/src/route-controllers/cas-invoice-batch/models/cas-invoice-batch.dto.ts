import { CASInvoiceBatchApprovalStatus } from "@sims/sims-db";
import { IsNotEmpty } from "class-validator";

export class CASInvoiceBatchAPIOutDTO {
  id: number;
  batchName: string;
  batchDate: Date;
  approvalStatus: CASInvoiceBatchApprovalStatus;
  approvalStatusUpdatedOn: Date;
  approvalStatusUpdatedBy: string;
}

export class UpdateCASInvoiceBatchAPIInDTO {
  @IsNotEmpty()
  approvalStatus: CASInvoiceBatchApprovalStatus;
}
