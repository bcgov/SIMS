import { ProgramIntensity, ProgramStatus } from "@sims/sims-db";
import { Allow } from "class-validator";

export interface ProgramDeliveryTypes {
  deliveredOnSite: boolean;
  deliveredOnline: boolean;
}

export class EntranceRequirements {
  @Allow()
  hasMinimumAge: boolean;
  @Allow()
  minHighSchool: boolean;
  @Allow()
  requirementsByInstitution: boolean;
  @Allow()
  requirementsByBCITA: boolean;
}

export interface SaveEducationProgram {
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
  programStatus: ProgramStatus;
  fieldOfStudyCode: number;
}

export interface EducationProgramsSummary {
  programId: number;
  programName: string;
  cipCode: string;
  credentialType: string;
  submittedDate: Date;
  programStatus: ProgramStatus;
  totalOfferings: number;
  locationId: number;
  locationName: string;
}
