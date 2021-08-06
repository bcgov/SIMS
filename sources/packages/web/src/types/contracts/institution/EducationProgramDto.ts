/**
 * Program Intensities of the Program.
 */
export enum ProgramIntensity {
  /**
   * Program with ProgramIntensity = fullTimePartTime, will be both Full Time and Part Time
   */
  fullTimePartTime = "fullTimePartTime",
  /**
   *  Program with ProgramIntensity = fullTime, will be only Full Time
   */
  fullTime = "fullTime",
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
