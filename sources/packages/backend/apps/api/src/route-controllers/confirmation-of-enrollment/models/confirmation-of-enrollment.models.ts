export interface ConfirmEnrollmentOptions {
  /**
   * location id of the application.
   */
  locationId?: number;
  /**
   * Allow COEs which are outside the valid COE confirmation period to be confirmed
   * by institution.
   */
  allowOutsideCOEApprovalPeriod?: boolean;
}
