import { OfferingIntensity } from "@/types/contracts/OfferingContact";

/**
 * Program offering summary DTO for Vue.
 */
export interface EducationProgramOfferingDto {
  id: number;
  name: string;
  studyStartDate: string;
  studyEndDate: string;
  studyDates: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
}

/**
 * Represents the status of an offering.
 */
export enum OfferingStatus {
  Approved = "Approved",
  Pending = "Pending",
  Declined = "Declined",
  UnderReview = "Under review",
  AwaitingApproval = "Awaiting approval",
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
