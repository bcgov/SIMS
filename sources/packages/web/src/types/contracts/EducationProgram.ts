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
