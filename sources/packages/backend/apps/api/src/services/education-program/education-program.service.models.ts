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

export enum EntranceRequirementValues {
  HasMinimumAge = "hasMinimumAge",
  MinHighSchool = "minHighSchool",
  RequirementsByInstitution = "requirementsByInstitution",
  RequirementsByBCITA = "requirementsByBCITA",
  NoneOfTheAboveEntranceRequirements = "noneOfTheAboveEntranceRequirements",
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
}

/**
 * Evaluation result for calculated data of education programs.
 */
export interface ProgramEvaluationResult {
  [ProgramCalculatedDataKey.FieldOfStudyCode]?: number;
}

export interface ProgramEvaluationContext {
  isBCPublic: boolean;
  isBCPrivate: boolean;
}
