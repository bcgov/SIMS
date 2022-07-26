import {
  EntranceRequirements,
  ProgramDeliveryTypes,
  ProgramIntensity,
  ProgramStatus,
} from "@/types";

export interface EducationProgramAPIOutDTO {
  institutionId: number;
  isBCPrivate: boolean;
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
  hasOfferings: boolean;
}

/**
 * Subset information of a education program to be used
 * to describe a program without retrieving all the
 * program information.
 */
export interface EducationProgramDetailsAPIOutDTO {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeToDisplay: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  programStatus: string;
  programIntensity: ProgramIntensity;
  institutionProgramCode?: string;
  submittedDate: Date;
  submittedBy: string;
  assessedDate?: Date;
  assessedBy?: string;
  effectiveEndDate: string;
  institutionName: string;
}

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
}
