import { credentialTypeToDisplay } from "../../utilities/credential-type-utils";
import { ProgramIntensity } from "../../database/entities/program-intensity.type";
/**
 * Service level interface for education programs object.
 */
export interface SaveEducationProgram {
  id?: number;
  institutionId: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeOther: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
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
  approvalStatus: string;
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

export interface ProgramDeliveryTypes {
  deliveredOnSite: boolean;
  deliveredOnline: boolean;
}

export class EducationProgramsSummary {
  id: number;
  name: string;
  cipCode: string;
  credentialType: string;
  credentialTypeOther: string;
  approvalStatus: string;
  totalOfferings: number;
  get credentialTypeToDisplay(): string {
    return credentialTypeToDisplay(
      this.credentialType,
      this.credentialTypeOther,
    );
  }
}

export class EducationProgramModel {
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
  get credentialTypeToDisplay(): string {
    return credentialTypeToDisplay(
      this.credentialType,
      this.credentialTypeOther,
    );
  }
}

export interface EntranceRequirements {
  hasMinimunAge: boolean;
  minHighSchool: boolean;
  requirementsByInstitution: boolean;
  requirementsByBcita: boolean;
}
