import { StudentAppealStatus } from "@/types";

export interface StudentAppealRequestApiInDTO {
  formName: string;
  formData: any;
}

export interface StudentAppealApiInDTO {
  studentAppealRequests: StudentAppealRequestApiInDTO[];
}

export interface StudentAppealRequestApiOutDTO {
  id: number;
  submittedData: any;
  submittedFormName: string;
  appealStatus: StudentAppealStatus;
  assessedDate?: Date;
  assessedByUserName?: string;
  noteDescription?: string;
}

export interface StudentAppealApiOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus;
  appealRequests: StudentAppealRequestApiOutDTO[];
}

export interface StudentAppealRequestApprovalApiInDTO {
  id: number;
  appealStatus: StudentAppealStatus;
  noteDescription: string;
}

export interface StudentAppealApprovalApiInDTO {
  requests: StudentAppealRequestApprovalApiInDTO[];
}
