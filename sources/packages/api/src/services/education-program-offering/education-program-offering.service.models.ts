import {
  OfferingIntensity,
  StudyBreaksAndWeeks,
  OfferingStatus,
  OfferingTypes,
} from "../../database/entities";

export class EducationProgramOfferingModel {
  id: number;
  name: string;
  studyStartDate: string;
  studyEndDate: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
  offeringType: OfferingTypes;
  offeringStatus: OfferingStatus;
}

export interface SaveOfferingModel {
  offeringName: string;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  offeringDelivered: string;
  lacksStudyBreaks: boolean;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  showYearOfStudy?: boolean;
  hasOfferingWILComponent: string;
  offeringWILType?: string;
  breaksAndWeeks: StudyBreaksAndWeeks;
  offeringDeclaration: boolean;
  assessedBy?: string;
  assessedDate?: Date;
  submittedDate?: Date;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
  courseLoad?: number;
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

export interface PrecedingOfferingSummaryModel {
  offeringId: number;
  applicationsCount: number;
}
