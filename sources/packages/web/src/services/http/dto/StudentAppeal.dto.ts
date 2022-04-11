import { StudentAppealStatus } from "@/types";

export interface StudentAppealRequestAPIInDTO {
  formName: string;
  formData: any;
}

export interface StudentAppealAPIInDTO {
  studentAppealRequests: StudentAppealRequestAPIInDTO[];
}

export interface StudentAppealRequestAPIOutDTO {
  id: number;
  submittedData: any;
  submittedFormName: string;
  appealStatus: StudentAppealStatus;
  assessedDate?: Date;
  assessedByUserName?: string;
  noteDescription?: string;
}

export interface StudentAppealAPIOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus;
  appealRequests: StudentAppealRequestAPIOutDTO[];
}

export interface StudentAppealRequestApprovalAPIInDTO {
  id: number;
  appealStatus: StudentAppealStatus;
  noteDescription: string;
}

export interface StudentAppealApprovalAPIInDTO {
  requests: StudentAppealRequestApprovalAPIInDTO[];
}
