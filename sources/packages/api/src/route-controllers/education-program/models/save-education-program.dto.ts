import { ApprovalStatus } from "../../../services/education-program/constants";
import { EducationProgram, ProgramIntensity } from "../../../database/entities";
import { credentialTypeToDisplay } from "../../../utilities";
/**
 * Dto that represents education programs form object.
 */
export interface EducationProgramDto {
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

export interface EducationProgramDataDto extends EducationProgramDto {
  credentialTypeToDisplay: string;
  approvalStatus: ApprovalStatus;
  institutionId: number;
  id: number;
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
/**
 * Transformation util for Program.
 * @param EducationProgram
 * @returns Application DTO
 */
export const transformToEducationProgramData = (
  program: EducationProgram,
): EducationProgramDataDto => {
  return {
    id: program.id,
    approvalStatus: program.approvalStatus,
    name: program.name,
    description: program.description,
    credentialType: program.credentialType,
    cipCode: program.cipCode,
    nocCode: program.nocCode,
    sabcCode: program.sabcCode,
    regulatoryBody: program.regulatoryBody,
    programDeliveryTypes: {
      deliveredOnSite: program.deliveredOnSite,
      deliveredOnline: program.deliveredOnline,
    },
    deliveredOnlineAlsoOnsite: program.deliveredOnlineAlsoOnsite,
    sameOnlineCreditsEarned: program.sameOnlineCreditsEarned,
    earnAcademicCreditsOtherInstitution:
      program.earnAcademicCreditsOtherInstitution,
    courseLoadCalculation: program.courseLoadCalculation,
    completionYears: program.completionYears,
    eslEligibility: program.eslEligibility,
    hasJointInstitution: program.hasJointInstitution,
    hasJointDesignatedInstitution: program.hasJointDesignatedInstitution,
    programIntensity: program.programIntensity,
    institutionProgramCode: program.institutionProgramCode,
    minHoursWeek: program.minHoursWeek,
    isAviationProgram: program.isAviationProgram,
    minHoursWeekAvi: program.minHoursWeekAvi,
    entranceRequirements: {
      hasMinimumAge: program.hasMinimumAge,
      minHighSchool: program.minHighSchool,
      requirementsByInstitution: program.requirementsByInstitution,
      requirementsByBCITA: program.requirementsByBCITA,
    },
    hasWILComponent: program.hasWILComponent,
    isWILApproved: program.isWILApproved,
    wilProgramEligibility: program.wilProgramEligibility,
    hasTravel: program.hasTravel,
    travelProgramEligibility: program.travelProgramEligibility,
    hasIntlExchange: program.hasIntlExchange,
    intlExchangeProgramEligibility: program.intlExchangeProgramEligibility,
    programDeclaration: program.programDeclaration,
    credentialTypeToDisplay: credentialTypeToDisplay(program.credentialType),
    institutionId: program.institution.id,
  };
};

export class ProgramsSummary {
  programId: number;
  programName: string;
  submittedDate: Date;
  formattedSubmittedDate: string;
  locationName: string;
  locationId: number;
  programStatus: ApprovalStatus;
  totalOfferings: number;
}
