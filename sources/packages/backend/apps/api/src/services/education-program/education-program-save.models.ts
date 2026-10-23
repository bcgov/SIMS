import { FormYesNoOptions, ProgramIntensity } from "@sims/sims-db";
import { AviationCredentialTypeOptions } from "../education-program-offering/education-program-offering-validation.models";

export interface EducationProgramContext {
  hasOfferings: boolean;
  isActive: boolean;
  isBCPrivate: boolean;
  isBCPublic: boolean;
  isBCInstitution: boolean;
}

export interface EducationProgramData {
  programName: string;
  programDescription: string;
  [key: string]: unknown;
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
 * Known properties of the dynamic education program data that are also
 * persisted to the existing education program columns.
 */
export interface EducationProgramDynamicData extends EducationProgramData {
  credentialType: string;
  cipCode: string;
  nocCode?: string;
  sabcCode?: string;
  regulatoryBody: string;
  otherRegulatoryBody?: string;
  programDeliveryTypes: ProgramDeliveryTypeValues[];
  deliveredOnlineAlsoOnsite?: FormYesNoOptions;
  sameOnlineCreditsEarned?: FormYesNoOptions;
  earnAcademicCreditsOtherInstitution?: FormYesNoOptions;
  courseLoadCalculation: ProgramCourseLoadCalculationTypes;
  completionYears: string;
  entranceRequirements: EntranceRequirementValues[];
  eslEligibility: ProgramESLPercentage;
  hasJointInstitution: FormYesNoOptions;
  hasJointDesignatedInstitution?: FormYesNoOptions;
  programIntensity: ProgramIntensity;
  institutionProgramCode?: string;
  minHoursWeek?: FormYesNoOptions;
  isAviationProgram: FormYesNoOptions;
  credentialTypesAviation?: AviationCredentialTypeOptions[];
  minHoursWeekAvi?: FormYesNoOptions;
  hasWILComponent: FormYesNoOptions;
  isWILApproved?: FormYesNoOptions;
  wilProgramEligibility?: FormYesNoOptions;
  hasTravel: FormYesNoOptions;
  travelProgramEligibility?: FormYesNoOptions;
  hasIntlExchange: FormYesNoOptions;
  intlExchangeProgramEligibility?: FormYesNoOptions;
  programDeclaration: boolean;
}

export interface EducationProgramDynamicConfiguration {
  configurationId: number;
  programYearId: number;
  visualSchema: unknown;
  validationSchema: unknown;
  context: EducationProgramContext;
  updatedAt: Date;
}
