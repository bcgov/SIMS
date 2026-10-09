import {
  FormYesNoOptions,
  ProgramCalculatedDataKey,
  ProgramCourseLoadCalculationTypes,
  ProgramDeliveryTypeValues,
  ProgramESLPercentage,
  ProgramEvaluationResult,
  ProgramIntensity,
  ProgramStatus,
} from "@/types";
import { Expose } from "class-transformer";

/**
 * Values pre-populated into the program data only to execute the
 * client and server side validations. Never changed by the user
 * and never persisted.
 */
export class EducationProgramContextAPIOutDTO {
  hasOfferings: boolean;
  isActive: boolean;
  isBCPrivate: boolean;
  isBCPublic: boolean;
  isBCInstitution: boolean;
}

/**
 * Dynamic program data, whose shape is defined by the program
 * configuration schemas, plus the pre-populated context.
 */
export interface EducationProgramDataAPIOutDTO {
  [key: string]: unknown;
  context: EducationProgramContextAPIOutDTO;
}

export interface EducationProgramConfigurationAPIOutDTO {
  programData: EducationProgramDataAPIOutDTO;
  visualSchema: unknown;
  validationSchema: unknown;
}

/**
 * Education program complete information.
 * Shared between the Ministry and the Institution.
 */
export interface EducationProgramAPIOutDTO {
  id: number;
  programStatus: ProgramStatus;
  visualSchema: unknown;
  validationSchema: unknown;
  credentialType: string;
  credentialTypeToDisplay: string;
  programData: EducationProgramDataAPIOutDTO;
  institutionId: number;
  institutionName: string;
  submittedDate: Date;
  submittedBy: string;
  assessedDate?: Date;
  assessedBy?: string;
  effectiveEndDate?: string;
  isExpired: boolean;
}

/**
 * Education program information to be displayed in a summary list.
 */
export interface EducationProgramsSummaryAPIOutDTO {
  programId: number;
  programName: string;
  cipCode: string;
  sabcCode?: string;
  credentialType: string;
  totalOfferings: number;
  credentialTypeToDisplay: string;
  submittedDate: Date;
  locationName: string;
  locationId: number;
  programStatus: ProgramStatus;
  isActive: boolean;
  isExpired: boolean;
}

/**
 * Complete program information used to create or
 * update an education program.
 */
export class EducationProgramAPIInDTO {
  @Expose()
  name: string;
  @Expose()
  description?: string;
  @Expose()
  credentialType: string;
  @Expose()
  cipCode: string;
  @Expose()
  nocCode?: string;
  @Expose()
  sabcCode?: string;
  @Expose()
  regulatoryBody: string;
  @Expose()
  otherRegulatoryBody?: string;
  @Expose()
  programDeliveryTypes: ProgramDeliveryTypeValues[];
  @Expose()
  deliveredOnlineAlsoOnsite?: FormYesNoOptions;
  @Expose()
  sameOnlineCreditsEarned?: FormYesNoOptions;
  @Expose()
  earnAcademicCreditsOtherInstitution?: FormYesNoOptions;
  @Expose()
  courseLoadCalculation: ProgramCourseLoadCalculationTypes;
  @Expose()
  completionYears: string;
  @Expose()
  eslEligibility: ProgramESLPercentage;
  @Expose()
  hasJointInstitution: FormYesNoOptions;
  @Expose()
  hasJointDesignatedInstitution?: FormYesNoOptions;
  @Expose()
  programIntensity: ProgramIntensity;
  @Expose()
  institutionProgramCode?: string;
  @Expose()
  minHoursWeek?: FormYesNoOptions;
  @Expose()
  isAviationProgram: FormYesNoOptions;
  @Expose()
  minHoursWeekAvi?: FormYesNoOptions;
  @Expose()
  entranceRequirements: string[];
  @Expose()
  hasWILComponent: FormYesNoOptions;
  @Expose()
  isWILApproved?: FormYesNoOptions;
  @Expose()
  wilProgramEligibility?: FormYesNoOptions;
  @Expose()
  hasTravel: FormYesNoOptions;
  @Expose()
  travelProgramEligibility?: FormYesNoOptions;
  @Expose()
  hasIntlExchange: FormYesNoOptions;
  @Expose()
  intlExchangeProgramEligibility?: FormYesNoOptions;
  @Expose()
  programDeclaration: boolean;
  @Expose()
  credentialTypesAviation?: string[];
  @Expose()
  isBCPrivate: boolean;
  @Expose()
  isBCPublic: boolean;
}

export interface StudentEducationProgramAPIOutDTO {
  id: number;
  name: string;
  description: string;
  credentialTypeToDisplay: string;
  credentialType: string;
  deliveryMethod: string;
}

export interface ApproveProgramAPIInDTO {
  effectiveEndDate: string;
  approvedNote: string;
}

export interface DeclineProgramAPIInDTO {
  declinedNote: string;
}

export interface DeactivateProgramAPIInDTO {
  note: string;
}

export interface EducationProgramPendingAPIOutDTO {
  id: number;
  programName: string;
  institutionOperatingName: string;
  submittedDate: Date;
  institutionId: number;
  selectedLocationId: number;
}

export interface ProgramEvaluationDataAPIInDTO {
  credentialType?: string;
  cipCode?: string;
}

export interface ProgramEvaluationAPIInDTO {
  /**
   * Program evaluation data.
   */
  data: ProgramEvaluationDataAPIInDTO;
  /**
   * Keys of the calculated data to be evaluated.
   */
  calculatedDataKeys: ProgramCalculatedDataKey[];
}

export interface ProgramEvaluationAPIOutDTO {
  calculatedData: ProgramEvaluationResult;
}
