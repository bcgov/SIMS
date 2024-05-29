import {
  EntranceRequirements,
  ProgramDeliveryTypes,
  ProgramIntensity,
  ProgramStatus,
} from "@/types";
import { Expose, Type } from "class-transformer";

/**
 * Complete education program information needed for the institution.
 * Shared between the Ministry and the Institution.
 */
export interface EducationProgramAPIOutDTO {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeToDisplay: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  programStatus: ProgramStatus;
  regulatoryBody: string;
  otherRegulatoryBody?: string;
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
  hasOfferings: boolean;
  institutionId: number;
  institutionName: string;
  isBCPublic: boolean;
  isBCPrivate: boolean;
  submittedDate: Date;
  submittedBy: string;
  assessedDate?: Date;
  assessedBy?: string;
  effectiveEndDate?: string;
  fieldOfStudyCode: number;
  isActive: boolean;
  isExpired: boolean;
}

/**
 * Education program information to be displayed in a summary list.
 */
export interface EducationProgramsSummaryAPIOutDTO {
  programId: number;
  programName: string;
  cipCode: string;
  credentialType: string;
  totalOfferings: number;
  credentialTypeToDisplay: string;
  submittedDate: Date;
  locationName: string;
  locationId: number;
  programStatus: ProgramStatus;
  isActive: boolean;
  isExpired: boolean;
}

/**
 * Complete program information used to create or
 * update an education program.
 */
export class EducationProgramAPIInDTO {
  @Expose()
  name: string;
  @Expose()
  description?: string;
  @Expose()
  credentialType: string;
  @Expose()
  cipCode: string;
  @Expose()
  nocCode: string;
  @Expose()
  sabcCode: string;
  @Expose()
  regulatoryBody: string;
  @Expose()
  otherRegulatoryBody?: string;
  @Expose()
  programDeliveryTypes: ProgramDeliveryTypes;
  @Expose()
  deliveredOnlineAlsoOnsite?: string;
  @Expose()
  sameOnlineCreditsEarned?: string;
  @Expose()
  earnAcademicCreditsOtherInstitution?: string;
  @Expose()
  courseLoadCalculation: string;
  @Expose()
  completionYears: string;
  @Expose()
  eslEligibility: string;
  @Expose()
  hasJointInstitution: string;
  @Expose()
  hasJointDesignatedInstitution: string;
  @Expose()
  programIntensity: ProgramIntensity;
  @Expose()
  institutionProgramCode?: string;
  @Expose()
  minHoursWeek?: string;
  @Expose()
  isAviationProgram?: string;
  @Expose()
  minHoursWeekAvi?: string;
  @Expose()
  @Type(() => EntranceRequirements)
  entranceRequirements: EntranceRequirements;
  @Expose()
  hasWILComponent: string;
  @Expose()
  isWILApproved?: string;
  @Expose()
  wilProgramEligibility?: string;
  @Expose()
  hasTravel: string;
  @Expose()
  travelProgramEligibility?: string;
  @Expose()
  hasIntlExchange?: string;
  @Expose()
  intlExchangeProgramEligibility?: string;
  @Expose()
  programDeclaration: boolean;
  @Expose()
  fieldOfStudyCode: number;
  isBCPrivate: boolean;
  isBCPublic: boolean;
}

export interface StudentEducationProgramAPIOutDTO {
  id: number;
  name: string;
  description: string;
  credentialTypeToDisplay: string;
  credentialType: string;
  deliveryMethod: string;
}

export interface ApproveProgramAPIInDTO {
  effectiveEndDate: string;
  approvedNote: string;
}

export interface DeclineProgramAPIInDTO {
  declinedNote: string;
}

export interface DeactivateProgramAPIInDTO {
  note: string;
}
