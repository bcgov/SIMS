import { ApplicationEditStatus } from "@/types";

export interface ApplicationChangeRequestAPIInDTO {
  note: string;
  applicationEditStatus:
    | ApplicationEditStatus.ChangedWithApproval
    | ApplicationEditStatus.ChangeDeclined;
  studentId: number;
}
