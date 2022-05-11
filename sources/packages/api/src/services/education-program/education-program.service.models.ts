import { EducationProgramDto } from "../../route-controllers/education-program/models/save-education-program.dto";
import { ProgramIntensity, ProgramStatus } from "../../database/entities";
/**
 * DTO that is used to persist the eduction programs form data.
 */
export interface SaveEducationProgram extends EducationProgramDto {
  id?: number;
  institutionId: number;
  programStatus: ProgramStatus;
  userId: number;
}

export class EducationProgramsSummary {
  id: number;
  programName: string;
  cipCode: string;
  credentialType: string;
  programStatus: string;
  totalOfferings: number;
  credentialTypeToDisplay: string;
}

export interface EducationProgramWithTotalOfferings {
  id: number;
  name: string;
  description?: string;
  credentialType: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  regulatoryBody: string;
  deliveredOnSite: boolean;
  deliveredOnline: boolean;
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
  hasMinimumAge?: boolean;
  minHighSchool?: boolean;
  requirementsByInstitution?: boolean;
  requirementsByBCITA?: boolean;
  hasWILComponent: string;
  isWILApproved?: string;
  wilProgramEligibility?: string;
  hasTravel: string;
  travelProgramEligibility?: string;
  hasIntlExchange: string;
  intlExchangeProgramEligibility?: string;
  programDeclaration: boolean;
  programStatus: ProgramStatus;
  totalOfferings: number;
}
