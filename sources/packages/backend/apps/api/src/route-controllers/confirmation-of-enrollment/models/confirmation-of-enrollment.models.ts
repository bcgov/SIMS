import { ConfirmationOfEnrollmentAPIInDTO } from "./confirmation-of-enrollment.dto";

export interface ConfirmEnrollmentOptions {
  /**
   * location id of the application.
   */
  locationId?: number;
  /**
   * COE confirmation information.
   */
  payload?: ConfirmationOfEnrollmentAPIInDTO;
  /**
   * Allow study period who's study end date is past to be confirmed for enrolment.
   */
  allowPastStudyPeriod?: boolean;
  /**
   * Allow COEs which are outside the valid COE window to be confirmed.
   */
  allowOutsideCOEWindow?: boolean;
}
