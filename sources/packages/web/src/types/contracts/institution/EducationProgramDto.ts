import { OfferingStatus } from "@/types";

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
  credentialTypeToDisplay: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  programStatus: ProgramStatus;
  programIntensity: ProgramIntensity;
  institutionProgramCode?: string;
}

export interface SummaryEducationProgramDto {
  id: number;
  programName: string;
  credentialType: string;
  cipCode: string;
  totalOfferings: number;
  programStatus: ProgramStatus;
  credentialTypeToDisplay: string;
}

export interface EducationProgramDto extends EducationProgramBaseDto {
  id: number;
}

export interface EducationProgramDetails {
  name: string;
  description?: string;
  credentialType: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  regulatoryBody: string;
  programDeliveryTypes: ProgramDeliveryTypes;
  deliveredOnlineAlsoOnsite?: string;
  sameOnlineCreditsEarned?: string;
  earnAcademicCreditsOtherInstitution?: string;
  courseLoadCalculation: string;
  completionYears: string;
  eslEligibility: string;
  hasJointInstitution: string;
  hasJointDesignatedInstitution: string;
  programIntensity: ProgramIntensity;
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

export interface EducationProgramData extends EducationProgramDetails {
  credentialTypeToDisplay: string;
  programStatus: ProgramStatus;
  institutionId?: number;
  id: number;
  institutionName: string;
  submittedOn: Date;
  submittedBy: string;
  assessedDate?: Date;
  assessedByFirstName?: string;
  assessedByLastName?: string;
  effectiveEndDate: Date;
}

export interface StudentEducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialTypeToDisplay: string;
  credentialType: string;
  deliveryMethod: string;
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

export interface ApproveProgram {
  effectiveEndDate: string;
  approvedNote: string;
}

export interface DeclineProgram {
  declinedNote: string;
}

export interface ProgramOfferingHeader {
  institutionId: number;
  institutionName: string;
  submittedDate: string;
  status: ProgramStatus | OfferingStatus;
  assessedBy: string;
  assessedDate: string;
  effectiveEndDate?: Date; //this field is only for programs.
  locationName?: string; //this field is offering specific.
}

export interface ProgramOfferingApprovalLabels {
  assessedByLabel: string;
  assessedDateLabel: string;
}
