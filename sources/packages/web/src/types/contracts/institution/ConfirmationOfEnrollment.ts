/**
 * Possible status for Confirmation of Enrollment, when the Application_status is in Enrollment
 */
export enum COEStatus {
  /**
   * Confirmation of Enrollment is required
   */
  required = "Required",
  /**
   * Confirmation of Enrollment is Completed
   */
  completed = "Completed",
  /**
   * Confirmation of Enrollment is Declined,  not used in our current workflow but having it as an placeholder
   */
  declined = "Declined",
}

/**
 * Read only interface for study break item.
 * This is for COE where study breaks are shown in read only view.
 */
export interface StudyBreakCOE {
  breakStartDate: string;
  breakEndDate: string;
}

/**
 * Enum for COE enrollment period.
 */
export enum EnrollmentPeriod {
  /**
   * The ones considered inside a 21 days period
   * prior to the offering start date, that allow
   * them to be approved.
   */
  Current = "current",
  /**
   * The ones not yet inside a 21 days period
   * prior to the offering start date, that allow
   * them to be approved.
   */
  Upcoming = "upcoming",
}
/**
 * Approve confirmation of enrollment.
 */
export interface ApproveConfirmEnrollmentModel {
  requestedTuitionRemittance: string;
  tuitionRemittanceAmount: number;
}

/**
 * COE approval period status for institution.
 */
export enum COEApprovalPeriodStatus {
  /**
   * COE is within its valid approval period and can be approved.
   */
  WithinApprovalPeriod = "Within approval period",
  /**
   * COE is currently before its approval period
   * and needs to wait until approval period to be confirmed.
   */
  BeforeApprovalPeriod = "Before approval period",
  /**
   * The COE is currently crossed its approval period and cannot be confirmed by institution.
   */
  AfterApprovalPeriod = "After approval period",
}

/**
 * Indicates if the money amount information was already
 * sent to be paid to the student.
 */
export enum DisbursementScheduleStatus {
  /**
   * Waiting to be included in a e-Cert file.
   */
  Pending = "Pending",
  /**
   * The money values associated with the disbursement schedule
   * were included in an e-Cert file to be disbursed to the student.
   */
  Sent = "Sent",
  /**
   * The disbursement will no longer happen. Possible causes can include,
   * but are not limited to, when a reassessment happens or when the
   * application is canceled.
   */
  Cancelled = "Cancelled",
  /**
   * The status indicates that the disbursement has been rejected by ESDC
   * after being sent.
   */
  Rejected = "Rejected",
}
