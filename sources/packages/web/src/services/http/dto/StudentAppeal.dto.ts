import { StudentAppealStatus } from "@/types";

export interface StudentAppealRequestAPIInDTO {
  formName: string;
  formData: unknown;
}

export interface StudentAppealAPIInDTO {
  studentAppealRequests: StudentAppealRequestAPIInDTO[];
}

export interface StudentAppealRequestAPIOutDTO {
  id: number;
  submittedData: unknown;
  submittedFormName: string;
  appealStatus: StudentAppealStatus;
}

export interface DetailedStudentAppealRequestAPIOutDTO extends StudentAppealRequestAPIOutDTO {
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

export interface DetailedStudentAppealAPIOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus;
  appealRequests: DetailedStudentAppealRequestAPIOutDTO[];
}

export interface StudentAppealRequestApprovalAPIInDTO {
  id: number;
  appealStatus: StudentAppealStatus;
  noteDescription: string;
}

export interface StudentAppealApprovalAPIInDTO {
  requests: StudentAppealRequestApprovalAPIInDTO[];
}

export interface StudentAppealPendingSummaryAPIOutDTO {
  appealId: number;
  applicationId: number;
  studentId: number;
  submittedDate: Date;
  fullName: string;
  applicationNumber: string;
}
