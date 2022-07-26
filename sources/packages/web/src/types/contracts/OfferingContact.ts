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
 * DTO for program offering form object
 */
export interface OfferingDTO {
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
  // TODO: This dto is extended by some PIR dto and interfaces, clean up/take a copy of dto without "breaksAndWeeks" for PIR DTOs and remove studyBreaks from here during api reorganization.
  studyBreaks?: StudyBreak;
  offeringDeclaration: boolean;
  offeringStatus: OfferingStatus;
  assessedBy?: string;
  assessedDate?: Date;
  courseLoad?: number;
  hasExistingApplication?: boolean;
  institutionName: string;
  submittedDate: string;
  locationName: string;
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
 * Offering form edit model which consists of properties excluding the values derived at client.
 */
export type OfferingFormEditModel = Omit<
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

export interface ProgramOfferingDetailsDto {
  studyStartDate?: Date;
}

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
