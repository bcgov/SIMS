import { ApplicationEditStatus } from "@/types";

export interface ApplicationChangeRequestAPIInDTO {
  note: string;
  applicationChangeRequestStatus: ApplicationEditStatus;
  studentId: number;
}
