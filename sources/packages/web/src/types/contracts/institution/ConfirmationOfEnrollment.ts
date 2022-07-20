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
 * Read only Dto for study break item.
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
