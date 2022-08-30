import {
  ClientIdType,
  OfferingStatus,
  ProgramIntensity,
  ProgramDeliveryTypes,
} from "@/types";

/**
 * Valid Intensity of the Offerings.
 */
export enum OfferingIntensity {
  /**
   * Program with ProgramIntensity = partTime, will be Part Time
   */
  partTime = "Part Time",
  /**
   *  Program with ProgramIntensity = fullTime, will be Full Time
   */
  fullTime = "Full Time",
}

/**
 * This is a modal for Eduction Program Offering form.io
 ** It has client specific properties in addition to DTO returned from API.
 ** Whenever the DTO is enhanced please make sure this model is sync with DTO.
 */
export interface OfferingFormModel {
  programIntensity: ProgramIntensity;
  programDeliveryTypes: ProgramDeliveryTypes;
  hasWILComponent: string;
  offeringName: string;
  studyStartDate?: Date;
  studyEndDate?: Date;
  actualTuitionCosts?: number;
  programRelatedCosts?: number;
  mandatoryFees?: number;
  exceptionalExpenses?: number;
  offeringDelivered?: string;
  lacksStudyBreaks: boolean;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  showYearOfStudy?: boolean;
  hasOfferingWILComponent: string;
  offeringWILType?: string;
  breaksAndWeeks?: StudyBreaksAndWeeks;
  offeringDeclaration: boolean;
  offeringStatus: OfferingStatus;
  offeringChipStatus: string;
  clientType?: ClientIdType;
  offeringStatusToDisplay: OfferingStatus;
  hasExistingApplication?: boolean;
}

/**
 * Offering form base model which consists of properties excluding the values derived at client.
 */
export type OfferingFormBaseModel = Omit<
  OfferingFormModel,
  "offeringChipStatus" | "offeringStatusToDisplay" | "clientType"
>;

/**
 * Offering form create model which consists of program related properties to
 * validate offering on creation.
 */
export type OfferingFormCreateModel = Pick<
  OfferingFormModel,
  "programIntensity" | "programDeliveryTypes" | "hasWILComponent"
>;

/**
 * Dto for study break item.
 */
export interface StudyBreak {
  breakStartDate: Date;
  breakEndDate: Date;
}
/**
 * Interface for study breaks with funded and unfunded weeks properties.
 */
export interface StudyBreaksAndWeeks {
  studyBreaks: StudyBreak[];
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}

export enum OfferingRelationType {
  ActualOffering = "Actual offering",
  PrecedingOffering = "Preceding offering",
}
