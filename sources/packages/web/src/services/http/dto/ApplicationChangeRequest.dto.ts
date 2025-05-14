import { ApplicationEditStatus } from "@/types";

export interface ApplicationChangeRequestAPIInDTO {
  note: string;
  applicationEditStatus:
    | ApplicationEditStatus.ChangedWithApproval
    | ApplicationEditStatus.ChangeDeclined;
}

export interface ApplicationChangeRequestPendingSummaryAPIOutDTO {
  applicationId: number;
  parentApplicationId: number;
  studentId: number;
  submittedDate: Date;
  firstName?: string;
  lastName: string;
  applicationNumber: string;
}
