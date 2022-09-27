import {
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
  Application,
} from "../../database/entities";

export interface EducationProgramOfferingSummaryModel {
  id: number;
  name: string;
  studyStartDate: string;
  studyEndDate: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
  offeringType: OfferingTypes;
  offeringStatus: OfferingStatus;
}

/**
 * Filter object to pass all the offering optional filters.
 ** offeringTypes is mandatory here, but it is assigned by the controller as
 ** per the need of the API.
 */
export interface OfferingsFilter {
  offeringTypes: OfferingTypes[];
  offeringStatus?: OfferingStatus;
  offeringIntensity?: OfferingIntensity;
}

/**
 * Model to display the summary of preceding offering details.
 */
export interface PrecedingOfferingSummaryModel {
  applicationsCount: number;
}

/**
 * The additional properties which are required
 * to start the new assessment workflow
 * and delete the existing workflow instance for an application.
 */
export class ApplicationAssessmentSummary extends Application {
  assessmentWorkflowId: string;
  workflowName: string;
  hasAssessmentData: boolean;
}
