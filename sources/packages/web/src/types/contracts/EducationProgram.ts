import { EducationProgramsSummaryAPIOutDTO } from "@/services/http/dto";
import { FormYesNoOptions, OfferingStatus } from "@/types";
import { Expose } from "class-transformer";

/**
 * Program intensities of the education program.
 */
export enum ProgramIntensity {
  /**
   * Program with ProgramIntensity = Full Time and Part Time, will be both Full Time and Part Time
   */
  fullTimePartTime = "Full Time and Part Time",
  /**
   *  Program with ProgramIntensity = Full Time, will be only Full Time
   */
  fullTime = "Full Time",
}

export enum ProgramStatus {
  /**
   * Education Program is approved.
   */
  Approved = "Approved",
  /**
   * Education Program is pending.
   */
  Pending = "Pending",
  /**
   * Education Program is Declined.
   */
  Declined = "Declined",
}

export interface ProgramDeliveryTypes {
  deliveredOnSite: boolean;
  deliveredOnline: boolean;
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

export class EntranceRequirements {
  @Expose()
  hasMinimumAge: boolean;
  @Expose()
  minHighSchool: boolean;
  @Expose()
  requirementsByInstitution: boolean;
  @Expose()
  requirementsByBCITA: boolean;
  @Expose()
  noneOfTheAboveEntranceRequirements: boolean;
}

export interface AviationProgramCredentialTypes {
  commercialPilotTraining: boolean;
  instructorsRating: boolean;
  endorsements: boolean;
  privatePilotTraining: boolean;
}

export interface ProgramOfferingHeader {
  institutionId: number;
  institutionName: string;
  submittedDate: Date;
  submittedBy: string;
  status: ProgramStatus | OfferingStatus;
  assessedBy?: string;
  assessedDate?: Date;
  effectiveEndDate?: Date; // This field is only for programs.
  locationName: string; // This field is offering specific.
  parentOfferingId?: number;
}

export interface ProgramOfferingApprovalLabels {
  assessedByLabel: string;
  assessedDateLabel: string;
}

/**
 * Summary list view of programs shared between
 * the Ministry and the institutions.
 */
export interface EducationProgramsSummary extends EducationProgramsSummaryAPIOutDTO {
  submittedDateFormatted: string;
}

export interface ProgramFormModel {
  name: string;
  description?: string;
  credentialType: string;
  cipCode: string;
  fieldOfStudyCode: number;
  nocCode?: string;
  sabcCode?: string;
  institutionProgramCode?: string;
  programIntensity: ProgramIntensity;
  programDeliveryTypes: ProgramDeliveryTypeValues[];
  deliveredOnlineAlsoOnsite?: FormYesNoOptions;
  sameOnlineCreditsEarned?: FormYesNoOptions;
  earnAcademicCreditsOtherInstitution?: FormYesNoOptions;
  completionYears: string;
  courseLoadCalculation: ProgramCourseLoadCalculationTypes;
  minHoursWeek?: FormYesNoOptions;
  regulatoryBody: string;
  otherRegulatoryBody?: string;
  entranceRequirements: string[];
  eslEligibility: ProgramESLPercentage;
  hasJointInstitution: FormYesNoOptions;
  hasJointDesignatedInstitution?: FormYesNoOptions;
  hasWILComponent: FormYesNoOptions;
  isWILApproved?: FormYesNoOptions;
  wilProgramEligibility?: FormYesNoOptions;
  hasTravel: FormYesNoOptions;
  travelProgramEligibility?: FormYesNoOptions;
  hasIntlExchange: FormYesNoOptions;
  intlExchangeProgramEligibility?: FormYesNoOptions;
  isAviationProgram: FormYesNoOptions;
  credentialTypesAviation?: string[];
  minHoursWeekAvi?: FormYesNoOptions;
  programDeclaration: boolean;
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
