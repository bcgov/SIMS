import { EducationProgramsSummaryAPIOutDTO } from "@/services/http/dto";
import { OfferingStatus } from "@/types";

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
 * Status and renewal filters applied when listing the
 * programs of a program year.
 */
export interface ProgramStatusFilters {
  /**
   * Program statuses to be searched. When not provided,
   * programs are not filtered by status.
   */
  statusSearch?: ProgramStatus[];
  /**
   * Indicates that only inactive programs must be listed.
   */
  inactiveProgramSearch: boolean;
  /**
   * Indicates that only programs already renewed into the
   * next program year must be listed.
   */
  renewedProgramSearch: boolean;
  /**
   * Indicates that only programs not yet renewed into the
   * next program year must be listed.
   */
  notRenewedProgramSearch: boolean;
}

/**
 * Summary list view of programs shared between
 * the Ministry and the institutions.
 */
export interface EducationProgramsSummary extends EducationProgramsSummaryAPIOutDTO {
  submittedDateFormatted: string;
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
