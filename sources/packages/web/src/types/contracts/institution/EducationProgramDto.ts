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
/**
 * Education program Base DTO object
 */
export interface EducationProgramBaseDto {
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

export interface SummaryEducationProgramDto {
  id: number;
  name: string;
  credentialType: string;
  credentialTypeOther: string;
  cipCode: string;
  offeringsCount: number;
  approvalStatus: string;
}

export interface EducationProgramDto extends EducationProgramBaseDto {
  id: number;
}

export interface StudentEducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialTypeToDisplay: string;
  deliveryMethod: string;
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

/**
 * DTO object which represent the eduction program form object.
 */
export interface ProgramDto extends EducationProgramBaseDto {
  institutionId: number;
  regulatoryBody: string;
  programDeliveryTypes: ProgramDeliveryTypes;
  deliveredOnlineAlsoOnsite?: string;
  sameOnlineCreditsEarned?: string;
  earnAcademicCreditsOtherInstitution?: string;
  courseLoadCalculation: string;
  averageHoursStudy: number;
  completionYears: string;
  admissionRequirement: string;
  eslEligibility: string;
  hasJointInstitution: string;
  hasJointDesignatedInstitution: string;
  institutionProgramCode?: string;
  minHoursWeek?: string;
  isAviationProgram?: string;
  minHoursWeekAvi?: string;
  entranceRequirements: EntranceRequirements;
  hasWILComponent: string;
  isWILApproved?: string;
  wilProgramEligibility?: string;
  hasTravel: string;
  travelProgramEligibility?: string;
  hasIntlExchange?: string;
  intlExchangeProgramEligibility?: string;
  programDeclaration: boolean;
}

export interface ProgramDeliveryTypes {
  deliveredOnSite: boolean;
  deliveredOnline: boolean;
}

export interface EntranceRequirements {
  hasMinimumAge: boolean;
  minHighSchool: boolean;
  requirementsByInstitution: boolean;
  requirementsByBCITA: boolean;
}
