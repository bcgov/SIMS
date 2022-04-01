import { StudentAppealStatus } from "@/types";

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
