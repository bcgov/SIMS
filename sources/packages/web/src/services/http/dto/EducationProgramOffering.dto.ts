import { OfferingStatus } from "@/types";

/**
 * Payload DTO to assess an offering.
 */
export interface OfferingAssessmentAPIInDTO {
  offeringStatus: OfferingStatus;
  assessmentNotes: string;
}

/**
 * DTO to display offering which is requested for change.
 */
export interface OfferingChangeRequestAPIOutDTO {
  offeringId: number;
  activeOfferingId: number;
  programId: number;
  offeringName: string;
  institutionName: string;
  locationName: string;
  submittedDate: Date;
}

export interface PrecedingOfferingSummaryAPIOutDTO {
  offeringId: number;
  applicationsCount: number;
}
