import { EducationProgramsSummaryAPIOutDTO } from "@/services/http/dto";
import { OfferingStatus } from "@/types";
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
  noneOfTheAbove: boolean;
}

export interface ProgramOfferingHeader {
  institutionId: number;
  institutionName: string;
  submittedDate: Date;
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
export interface EducationProgramsSummary
  extends EducationProgramsSummaryAPIOutDTO {
  submittedDateFormatted: string;
}
