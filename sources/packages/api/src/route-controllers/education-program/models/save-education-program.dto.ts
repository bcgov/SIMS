import {
  EducationProgram,
  ProgramIntensity,
  ProgramStatus,
} from "../../../database/entities";
import {
  credentialTypeToDisplay,
  getISODateOnlyString,
  getUserFullName,
} from "../../../utilities";

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
  programStatus: ProgramStatus;
  institutionId: number;
  id: number;
  institutionName: string;
  submittedDate: Date;
  submittedBy: string;
  assessedDate?: Date;
  assessedBy?: string;
  effectiveEndDate: string;
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
 * @param program
 * @returns Application DTO
 */
export const transformToEducationProgramData = (
  program: EducationProgram,
): EducationProgramDataDto => {
  const programDetails: EducationProgramDataDto = {
    id: program.id,
    programStatus: program.programStatus,
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
    institutionName: program.institution.operatingName,
    submittedDate: program.submittedDate,
    submittedBy: getUserFullName(program.submittedBy),
    effectiveEndDate: getISODateOnlyString(program.effectiveEndDate),
    assessedDate: program.assessedDate,
    assessedBy: getUserFullName(program.assessedBy),
  };

  return programDetails;
};

export interface ApproveProgram {
  effectiveEndDate: string;
  approvedNote: string;
}

export interface DeclineProgram {
  declinedNote: string;
}
