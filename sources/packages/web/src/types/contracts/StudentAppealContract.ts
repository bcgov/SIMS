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
  string?: Date;
  assessedByUserName?: string;
  showAudit: boolean;
}

export interface StudentAppealRequest {
  id?: number;
  data: any;
  formName: string;
  approval?: StudentAppealApproval;
}
