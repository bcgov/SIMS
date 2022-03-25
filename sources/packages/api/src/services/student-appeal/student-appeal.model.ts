import { StudentAppealStatus } from "../../database/entities";

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
