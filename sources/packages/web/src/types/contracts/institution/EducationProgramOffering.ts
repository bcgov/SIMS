import { OfferingBulkInsertValidationResultAPIOutDTO } from "@/services/http/dto";

/**
 * Represents the status of an offering.
 ** Offering statuses are grouped into the ones which are exclusively for offering creation
 ** and exclusively for offering change.
 ** Approved is a status which is common in both offering creation and offering change.
 ** Except approved all other statuses belong to either offering creation or offering change perspective.
 ** Offering creation is when the offering is created or modified by the institution and ministry either approves
 ** or declines the same if required.
 ** Offering change is when an approved offering is requested for change by the institution and ministry either approves
 ** or declines the same.
 */
export enum OfferingStatus {
  Approved = "Approved",
  // Status with respect to offering creation.
  CreationPending = "Creation pending",
  CreationDeclined = "Creation declined",
  // Status with respect to offering change.
  ChangeUnderReview = "Change under review",
  ChangeAwaitingApproval = "Change awaiting approval",
  ChangeOverwritten = "Change overwritten",
  ChangeDeclined = "Change declined",
}

/**
 * Possible types for an offering (Education Program Offering).
 */
export enum OfferingTypes {
  /**
   * Offering is available for all the students.
   */
  Public = "Public",
  /**
   * Offering was created to fulfill the need of
   * a particular student/application.
   */
  Private = "Private",
  /**
   * Offering created for a change in scholastic standing reported by institution.
   */
  ScholasticStanding = "Scholastic standing",
}

export interface CourseDetails {
  courseName: string;
  courseCode: string;
  courseStartDate: string;
  courseEndDate: string;
}

/**
 * Offering bul insert validation result with formatted values
 * to be displayed to the user.
 */
export interface OfferingsUploadBulkInsert
  extends OfferingBulkInsertValidationResultAPIOutDTO {
  /**
   * CSV line number that contains the error.
   * Should match with CSV/spreadsheet line number for easy troubleshoot.
   */
  recordLineNumber: number;
  /**
   * Offering start date formatted.
   */
  startDateFormatted?: string;
  /**
   * Offering end date formatted.
   */
  endDateFormatted?: string;
}
