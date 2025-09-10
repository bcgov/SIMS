import { OfferingIntensity, OfferingStatus, OfferingTypes } from "@/types";
import { Expose, Type } from "class-transformer";
import { ValidationResultAPIOutDTO } from "./Common.dto";

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
  programId: number;
  programName: string;
  offeringName: string;
  institutionName: string;
  locationName: string;
  submittedDate: Date;
}

/**
 * DTO to display the summary of preceding offering details.
 */
export interface PrecedingOfferingSummaryAPIOutDTO {
  applicationsCount: number;
}

export interface OfferingChangeAssessmentAPIInDTO {
  offeringStatus: OfferingStatus;
  assessmentNotes: string;
}

export interface StudyBreakOutDTO {
  breakStartDate: Date;
  breakEndDate: Date;
}

export class StudyBreakInDTO {
  @Expose()
  breakStartDate: Date;
  @Expose()
  breakEndDate: Date;
}

export class EducationProgramOfferingAPIInDTO {
  @Expose()
  offeringName: string;
  @Expose()
  studyStartDate: string;
  @Expose()
  studyEndDate: string;
  @Expose()
  actualTuitionCosts: number;
  @Expose()
  programRelatedCosts: number;
  @Expose()
  mandatoryFees: number;
  @Expose()
  exceptionalExpenses: number;
  @Expose()
  offeringDelivered: OfferingDeliveryOptions;
  @Expose()
  lacksStudyBreaks: boolean;
  @Expose()
  offeringIntensity: OfferingIntensity;
  @Expose()
  yearOfStudy: number;
  @Expose()
  hasOfferingWILComponent: OfferingYesNoOptions;
  @Expose()
  offeringDeclaration: boolean;
  @Expose()
  offeringStatus: OfferingStatus;
  @Expose()
  offeringType: OfferingTypes;
  @Expose()
  isAviationOffering: OfferingYesNoOptions;
  @Expose()
  aviationCredentialType?: string;
  @Expose()
  offeringWILComponentType?: string;
  @Expose()
  @Type(() => StudyBreakInDTO)
  studyBreaks: StudyBreakInDTO[];
  @Expose()
  courseLoad?: number;
  @Expose()
  onlineInstructionMode?: OnlineInstructionModeOptions;
  @Expose()
  isOnlineDurationSameAlways?: OfferingYesNoOptions;
  @Expose()
  totalOnlineDuration?: number;
  @Expose()
  minimumOnlineDuration?: number;
  @Expose()
  maximumOnlineDuration?: number;
}

/**
 * Offering delivery options.
 */
export enum OfferingDeliveryOptions {
  Onsite = "onsite",
  Online = "online",
  Blended = "blended",
}

/**
 * Offering Yes/No options.
 */
export enum OfferingYesNoOptions {
  Yes = "yes",
  No = "no",
}

/**
 * Offering online instruction modes.
 */
export enum OnlineInstructionModeOptions {
  SynchronousOnly = "synchronousOnly",
  AsynchronousOnly = "asynchronousOnly",
  SynchronousAndAsynchronous = "synchronousAndAsynchronous",
}

export interface EducationProgramOfferingAPIOutDTO {
  id: number;
  offeringName: string;
  studyStartDate: string;
  studyEndDate: string;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  offeringDelivered: string;
  lacksStudyBreaks: boolean;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  hasOfferingWILComponent: string;
  offeringDeclaration: boolean;
  offeringStatus: OfferingStatus;
  precedingOfferingId?: number;
  offeringType: OfferingTypes;
  isAviationOffering: OfferingYesNoOptions;
  aviationCredentialType?: string;
  offeringWILComponentType?: string;
  studyBreaks: StudyBreakAPIOutDTO[];
  studyPeriodBreakdown: StudyPeriodBreakdownAPIOutDTO;
  assessedBy?: string;
  assessedDate?: Date;
  submittedDate: Date;
  courseLoad?: number;
  hasExistingApplication?: boolean;
  locationName: string;
  institutionId: number;
  institutionName: string;
  validationWarnings: string[];
  validationInfos: string[];
  parentOfferingId: number;
  isBCPublic: boolean;
  isBCPrivate: boolean;
  onlineInstructionMode?: OnlineInstructionModeOptions;
  isOnlineDurationSameAlways?: OfferingYesNoOptions;
  totalOnlineDuration?: number;
  minimumOnlineDuration?: number;
  maximumOnlineDuration?: number;
}

export interface StudyBreakAPIOutDTO {
  breakStartDate: string;
  breakEndDate: string;
}

export interface EducationProgramOfferingSummaryAPIOutDTO {
  id: number;
  name: string;
  yearOfStudy: number;
  studyStartDate: string;
  studyEndDate: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
  offeringType: OfferingTypes;
  offeringStatus: OfferingStatus;
}

export interface OfferingDetailsAPIOutDTO {
  studyStartDate: string;
  studyEndDate: string;
}

/**
 * Represents the possible errors that can happen during the
 * offerings bulk insert and provides a detailed description
 * for every record that has an error.
 */
export interface OfferingBulkInsertValidationResultAPIOutDTO {
  recordIndex: number;
  locationCode?: string;
  sabcProgramCode?: string;
  startDate?: string;
  endDate?: string;
  offeringStatus?: OfferingStatus.Approved | OfferingStatus.CreationPending;
  errors: string[];
  infos: ValidationResultAPIOutDTO[];
  warnings: ValidationResultAPIOutDTO[];
}

export interface StudyPeriodBreakdownAPIOutDTO {
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}

/**
 * Status of an offering validation during creation or during
 * an complete update when the status is determined.
 */
export interface OfferingValidationResultAPIOutDTO {
  offeringStatus?: OfferingStatus.Approved | OfferingStatus.CreationPending;
  errors: string[];
  infos: ValidationResultAPIOutDTO[];
  warnings: ValidationResultAPIOutDTO[];
  studyPeriodBreakdown: StudyPeriodBreakdownAPIOutDTO;
  validationDate: Date;
}

/**
 * Offering data that can be freely changed and will not affect
 * the assessment in case there is one associated.
 */
export class EducationProgramOfferingBasicDataAPIInDTO {
  @Expose()
  offeringName: string;
}

export interface EducationProgramOfferingSummaryViewAPIOutDTO {
  id: number;
  offeringName: string;
  studyStartDate: string;
  studyEndDate: string;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  offeringDelivered: string;
  lacksStudyBreaks: boolean;
  offeringIntensity: OfferingIntensity;
  studyBreaks?: StudyBreakAPIOutDTO[];
  locationName: string;
  programId: number;
  programName: string;
  programDescription: string;
  programCredential: string;
  programCredentialTypeToDisplay: string;
  programDelivery: string;
}
