import { StudentAppealStatus } from "./StudentAppealStatus";

export enum AppealFormMode {
  Submission = "Submission",
  Approval = "Approval",
  ApprovalView = "ApprovalView",
}

export interface StudentAppealApproval {
  id: number;
  appealStatus: StudentAppealStatus;
  noteDescription: string;
  assessedDate?: string;
  assessedByUserName?: string;
  showAudit: boolean;
}

export interface StudentAppeal {
  id?: number;
  data: unknown;
  formName: string;
  approval?: StudentAppealApproval;
}

export interface StudentAppealRequest extends StudentAppeal {
  files: string[];
}
