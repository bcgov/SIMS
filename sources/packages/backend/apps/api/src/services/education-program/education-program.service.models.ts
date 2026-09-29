import {
  AviationProgramCredentialTypes,
  FormYesNoOptions,
  ProgramIntensity,
  ProgramStatus,
} from "@sims/sims-db";

export interface ProgramDeliveryTypes {
  deliveredOnSite: boolean;
  deliveredOnline: boolean;
}

export interface EntranceRequirements {
  hasMinimumAge: boolean;
  minHighSchool: boolean;
  requirementsByInstitution: boolean;
  requirementsByBCITA: boolean;
  noneOfTheAboveEntranceRequirements: boolean;
}

export interface SaveEducationProgram {
  name: string;
  description?: string;
  credentialType: string;
  cipCode: string;
  nocCode?: string;
  sabcCode?: string;
  regulatoryBody: string;
  otherRegulatoryBody?: string;
  programDeliveryTypes: ProgramDeliveryTypes;
  deliveredOnlineAlsoOnsite?: FormYesNoOptions;
  sameOnlineCreditsEarned?: FormYesNoOptions;
  earnAcademicCreditsOtherInstitution?: FormYesNoOptions;
  courseLoadCalculation: ProgramCourseLoadCalculationTypes;
  completionYears: string;
  eslEligibility: ProgramESLPercentage;
  hasJointInstitution: FormYesNoOptions;
  hasJointDesignatedInstitution?: FormYesNoOptions;
  programIntensity: ProgramIntensity;
  institutionProgramCode?: string;
  minHoursWeek?: FormYesNoOptions;
  isAviationProgram: FormYesNoOptions;
  minHoursWeekAvi?: FormYesNoOptions;
  entranceRequirements: EntranceRequirements;
  hasWILComponent: FormYesNoOptions;
  isWILApproved?: FormYesNoOptions;
  wilProgramEligibility?: FormYesNoOptions;
  hasTravel: FormYesNoOptions;
  travelProgramEligibility?: FormYesNoOptions;
  hasIntlExchange: FormYesNoOptions;
  intlExchangeProgramEligibility?: FormYesNoOptions;
  programDeclaration: boolean;
  credentialTypesAviation?: AviationProgramCredentialTypes;
}

/**
 * Education Program Summary.
 * Includes the count of total offerings and location information.
 */
export interface EducationProgramSummary {
  programId: number;
  programName: string;
  programStatus: ProgramStatus;
  isActive: boolean;
  submittedDate: Date;
  effectiveEndDate?: Date;
  totalOfferings: number;
  locationId: number;
  locationName: string;
  cipCode: string;
  sabcCode?: string;
  credentialType: string;
}

/**
 * Education Program with selected location for pending programs queue.
 */
export class PendingEducationProgram {
  id: number;
  name: string;
  submittedDate: Date;
  institution: {
    id: number;
    operatingName: string;
  };
  selectedLocationId: number;
}

export enum ProgramDeliveryTypeValues {
  Onsite = "deliveredOnSite",
  Online = "deliveredOnline",
}

export enum ProgramCourseLoadCalculationTypes {
  Credit = "credit",
  Hours = "hours",
}

export enum ProgramESLPercentage {
  LessThan20 = "lessThan20",
  GreaterThanEqual20 = "20OrMore",
}

/**
 * Keys of calculated data for education programs.
 */
export enum ProgramCalculatedDataKey {
  FieldOfStudyCode = "fieldOfStudyCode",
  ProgramStatus = "programStatus",
}

/**
 * Evaluation result for calculated data of education programs.
 */
export interface ProgramEvaluationResult {
  [ProgramCalculatedDataKey.FieldOfStudyCode]?: number;
  [ProgramCalculatedDataKey.ProgramStatus]?: ProgramStatus;
}

export interface ProgramEvaluationData {
  credentialType: string;
  cipCode: string;
  programDeliveryTypes: ProgramDeliveryTypes;
  deliveredOnlineAlsoOnsite: FormYesNoOptions;
  sameOnlineCreditsEarned: FormYesNoOptions;
  earnAcademicCreditsOtherInstitution: FormYesNoOptions;
  courseLoadCalculation: ProgramCourseLoadCalculationTypes;
  minHoursWeek: FormYesNoOptions;
  entranceRequirements: EntranceRequirements;
  eslEligibility: ProgramESLPercentage;
  hasJointInstitution: FormYesNoOptions;
  hasJointDesignatedInstitution: FormYesNoOptions;
  hasWILComponent: FormYesNoOptions;
  isWILApproved: FormYesNoOptions;
  wilProgramEligibility: FormYesNoOptions;
  hasTravel: FormYesNoOptions;
  travelProgramEligibility: FormYesNoOptions;
  intlExchangeProgramEligibility: FormYesNoOptions;
  hasIntlExchange: FormYesNoOptions;
  isAviationProgram: FormYesNoOptions;
}

export interface ProgramEvaluationContext {
  isBCPublic: boolean;
  isBCPrivate: boolean;
}

/**
 * Values added to the dynamic program data only to execute the validations,
 * since the configuration schemas depend on them. Always built by the server
 * and never persisted.
 */
export interface EducationProgramDataContext {
  hasOfferings: boolean;
  isActive: boolean;
  isBCPublic: boolean;
  isBCPrivate: boolean;
  isBCInstitution: boolean;
}

/**
 * Dynamic program data, whose shape is defined by the program configuration.
 * Only the properties the server needs to know about are declared.
 */
export interface EducationProgramDynamicData extends Record<string, unknown> {
  programName?: string;
  programDescription?: string;
  programDeliveryTypes?: ProgramDeliveryTypeValues[];
  credentialTypesAviation?: string[];
  fieldOfStudyCode?: number;
}

/**
 * Dynamic program data and the configuration it was validated against,
 * persisted alongside the program columns.
 */
export interface SaveEducationProgramDynamicData {
  programData: EducationProgramDynamicData;
  programConfigurationId: number;
}

/**
 * Result of the dynamic program data validation.
 */
export type EducationProgramDataValidationResult =
  | { isValid: true; programData: EducationProgramDynamicData }
  | { isValid: false; errors: string[] };
