/**
 * Program Intensities of the Program.
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

export interface SummaryEducationProgramDto {
  id: number;
  name: string;
  credentialType: string;
  credentialTypeOther: string;
  cipCode: string;
  offeringsCount: number;
  approvalStatus: string;
}

export interface EducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeOther: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  approvalStatus: string;
  programIntensity: ProgramIntensity;
}

export enum ApprovalStatus {
  /**
   * Education Program is approved.
   */
  approved = "approved",
  /**
   * Education Program is pending.
   */
  pending = "pending",
}
