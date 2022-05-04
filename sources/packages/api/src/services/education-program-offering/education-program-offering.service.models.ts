import {
  OfferingIntensity,
  StudyBreak,
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

export interface ProgramOfferingModel {
  id: number;
  name: string;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  lacksStudyDates: boolean;
  lacksStudyBreaks: boolean;
  lacksFixedCosts: boolean;
  tuitionRemittanceRequested: string;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  showYearOfStudy?: boolean;
  hasOfferingWILComponent: string;
  offeringWILType?: string;
  studyBreaks?: StudyBreak[];
  offeringDeclaration: boolean;
  submittedDate: Date;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
  locationName: string;
  institutionName: string;
}

export interface SaveOfferingModel {
  offeringName: string;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  lacksStudyDates: boolean;
  lacksStudyBreaks: boolean;
  lacksFixedCosts: boolean;
  tuitionRemittanceRequested: string;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  showYearOfStudy?: boolean;
  hasOfferingWILComponent: string;
  offeringWILType?: string;
  studyBreaks?: StudyBreak[];
  offeringDeclaration: boolean;
  assessedBy?: string;
  assessedDate?: Date;
  submittedDate?: Date;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
}

/**
 * Filter object to pass all the offering optional filters.
 ** offeringTypes defaulted to Public hence it needs to be assigned with value
 ** only if private offerings are needed from the service.
 */
export class OfferingsFilter {
  offeringTypes?: OfferingTypes[] = [OfferingTypes.Public];
  offeringStatus?: OfferingStatus;
  offeringIntensity?: OfferingIntensity;
}
