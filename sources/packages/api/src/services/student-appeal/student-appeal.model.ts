import { StudentAppeal, StudentAppealStatus } from "../../database/entities";

/**
 * Service model for student appeal.
 */
export interface StudentAppealRequestModel {
  formName: string;
  formData: any;
}

/**
 * Service model to fetch Pending And Denied Appeals.
 */
export interface PendingAndDeniedAppeals {
  submittedDate: Date;
  status: StudentAppealStatus;
}

/**
 * Student appeal with additional properties.
 */
export class StudentAppealWithStatus extends StudentAppeal {
  /**
   * Appeal status defined based in the individual status of
   * each student appeal request record.
   */
  status: StudentAppealStatus;
}
