import {
  OfferingTypes,
  OfferingStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
  OfferingIntensity,
  OFFERING_NAME_MAX_LENGTH,
} from "@sims/sims-db";
import { Allow, IsEnum, IsIn, IsNotEmpty, MaxLength } from "class-validator";
import { Type } from "class-transformer";
import {
  OfferingDeliveryOptions,
  OnlineInstructionModeOptions,
  OfferingYesNoOptions,
} from "../../../services";

export class StudyBreakAPIOutDTO {
  breakStartDate: string;
  breakEndDate: string;
}

export class StudyBreakInDTO {
  @Allow()
  breakStartDate: string;
  @Allow()
  breakEndDate: string;
}

export class StudyBreaksAndWeeksOutDTO {
  studyBreaks: StudyBreakAPIOutDTO[];
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}

export class StudyPeriodBreakdownAPIOutDTO {
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}

/**
 * Complete offering data to execute create, update or
 * request a change.
 *!The validations are handled by the OfferingValidationModel.
 */
export class EducationProgramOfferingAPIInDTO {
  @Allow()
  offeringName: string;
  @Allow()
  studyStartDate: string;
  @Allow()
  studyEndDate: string;
  @Allow()
  actualTuitionCosts: number;
  @Allow()
  programRelatedCosts: number;
  @Allow()
  mandatoryFees: number;
  @Allow()
  exceptionalExpenses: number;
  @Allow()
  offeringDelivered: OfferingDeliveryOptions;
  @Allow()
  lacksStudyBreaks: boolean;
  @Allow()
  offeringIntensity: OfferingIntensity;
  @Allow()
  yearOfStudy: number;
  @Allow()
  hasOfferingWILComponent: OfferingYesNoOptions;
  @Allow()
  offeringDeclaration: boolean;
  @Allow()
  offeringStatus: OfferingStatus;
  @Allow()
  offeringType: OfferingTypes;
  @Allow()
  offeringWILComponentType?: string;
  @Allow()
  @Type(() => StudyBreakInDTO)
  studyBreaks: StudyBreakInDTO[];
  @Allow()
  courseLoad?: number;
  @Allow()
  onlineInstructionMode?: OnlineInstructionModeOptions;
  @Allow()
  isOnlineDurationSameAlways?: OfferingYesNoOptions;
  @Allow()
  totalOnlineDuration?: number;
  @Allow()
  minimumOnlineDuration?: number;
  @Allow()
  maximumOnlineDuration?: number;
}

/**
 * Offering data that can be freely changed and will not
 * affect the assessment in case there is one associated.
 */
export class EducationProgramOfferingBasicDataAPIInDTO {
  @IsNotEmpty()
  @MaxLength(OFFERING_NAME_MAX_LENGTH)
  offeringName: string;
}

export class EducationProgramOfferingAPIOutDTO {
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
  isInstitutionBCPublic: boolean;
  isInstitutionBCPrivate: boolean;
}

export class EducationProgramOfferingSummaryViewAPIOutDTO {
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

export class EducationProgramOfferingSummaryAPIOutDTO {
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

export class OfferingDetailsAPIOutDTO {
  studyStartDate: string;
  studyEndDate: string;
}

export class OfferingAssessmentAPIInDTO {
  @IsEnum(OfferingStatus)
  offeringStatus: OfferingStatus;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  assessmentNotes: string;
}

/**
 * DTO to display offering which is requested for change.
 */
export class OfferingChangeRequestAPIOutDTO {
  offeringId: number;
  programId: number;
  offeringName: string;
  institutionName: string;
  locationName: string;
  submittedDate: Date;
}

/**
 * DTO to display the summary of preceding offering details.
 */
export class PrecedingOfferingSummaryAPIOutDTO {
  applicationsCount: number;
}

export class OfferingChangeAssessmentAPIInDTO {
  @IsIn([OfferingStatus.Approved, OfferingStatus.ChangeDeclined])
  offeringStatus: OfferingStatus;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  assessmentNotes: string;
}

/**
 * Offering validation result including study period breakdown
 * calculations that also supports the validation process.
 */
export class OfferingValidationResultAPIOutDTO {
  offeringStatus?: OfferingStatus.Approved | OfferingStatus.CreationPending;
  errors: string[];
  infos: ValidationResultAPIOutDTO[];
  warnings: ValidationResultAPIOutDTO[];
  studyPeriodBreakdown: StudyPeriodBreakdownAPIOutDTO;
}

/**
 * Represents the possible errors that can happen during the
 * offerings bulk insert and provides a detailed description
 * for every record that has an error.
 */
export class OfferingBulkInsertValidationResultAPIOutDTO {
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

/**
 * Indicates the offering summary purpose.
 */
export enum OfferingSummaryPurpose {
  /**
   * Purpose - Application Offering Change.
   */
  ApplicationOfferingChange = "application-offering-change",
}

/**
 * Represents an error considered not critical for
 * an offering and provides a user-friendly message
 * and a type that uniquely identifies this warning
 * or info.
 */
class ValidationResultAPIOutDTO {
  typeCode: string;
  message: string;
}
