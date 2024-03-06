import { StudentAppeal, StudentAppealStatus } from "@sims/sims-db";

/**
 * Service model for student appeal.
 */
export interface StudentAppealRequestModel {
  formName: string;
  formData: any;
  files: string[];
}

/**
 * Service model to fetch Pending And Denied Appeals.
 */
export interface PendingAndDeniedAppeals {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus;
}

/**
 * Student appeal with additional properties.
 */
export class StudentAppealWithStatus extends StudentAppeal {
  /**
   * Appeal status defined based on the individual status of
   * each student appeal request record.
   */
  status: StudentAppealStatus;
}

export interface StudentAppealRequestApproval {
  id: number;
  appealStatus: StudentAppealStatus;
  noteDescription: string;
}
