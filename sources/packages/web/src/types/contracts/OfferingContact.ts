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
  tuitionRemittanceRequestedAmount?: number;
  offeringDelivered?: string;
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
  offeringStatus: OfferingStatus;
  assessedBy?: string;
  assessedDate?: Date;
}

/**
 * This is a modal for Eduction Program Offering form.io
 ** It has client specific properties in addition to DTO returned from API.
 ** Whenever the DTO is enhanced please make sure this model is sync with DTO.
 */
export interface OfferingFormModel {
  offeringName: string;
  studyStartDate?: Date;
  studyEndDate?: Date;
  actualTuitionCosts?: number;
  programRelatedCosts?: number;
  mandatoryFees?: number;
  exceptionalExpenses?: number;
  tuitionRemittanceRequestedAmount?: number;
  offeringDelivered?: string;
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
  offeringStatus: OfferingStatus;
  offeringChipStatus: string;
  clientType?: ClientIdType;
  offeringStatusToDisplay: OfferingStatus;
}

export interface ProgramValidationModel {
  programIntensity: ProgramIntensity;
  programDeliveryTypes: ProgramDeliveryTypes;
  hasWILComponent: string;
}

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
