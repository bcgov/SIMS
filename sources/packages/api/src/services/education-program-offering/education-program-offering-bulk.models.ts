import {
  OfferingIntensity,
  OfferingTypes,
  StudyBreak,
} from "../../database/entities";

export interface ProgramDeliveryTypes {
  deliveredOnSite: boolean;
  deliveredOnline: boolean;
}

export interface SaveOfferingModel {
  offeringName: string;
  yearOfStudy: number;
  showYearOfStudy: boolean;
  offeringIntensity: OfferingIntensity;
  offeringDelivered: string;
  hasOfferingWILComponent: string;
  studyStartDate: Date;
  studyEndDate: Date;
  lacksStudyBreaks: boolean;
  studyBreaks: StudyBreak[];
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  programIntensity: string;
  programDeliveryTypes: ProgramDeliveryTypes;
  hasWILComponent: string;
  // To be validated.
  offeringType: OfferingTypes;
  programId: number;
  locationId: number;
  offeringDeclaration: boolean;
  courseLoad?: number;
}
