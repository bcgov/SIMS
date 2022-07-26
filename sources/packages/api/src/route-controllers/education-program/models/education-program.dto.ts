import { OmitType } from "@nestjs/swagger";
import { Allow, IsNotEmpty, MaxLength } from "class-validator";
import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  ProgramStatus,
} from "../../../database/entities";
import { ProgramIntensity } from "../../../database/entities/program-intensity.type";

/**
 * Education program complete information.
 */
export class EducationProgramAPIOutDTO {
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
  isBCPrivate: boolean;
}

export class AESTEducationProgramAPIOutDTO extends OmitType(
  EducationProgramAPIOutDTO,
  ["hasOfferings"],
) {
  submittedDate: Date;
  submittedBy: string;
  assessedDate?: Date;
  assessedBy?: string;
  effectiveEndDate: string;
}

/**
 * Subset information of a education program to be used
 * to describe a program without retrieving all the
 * program information.
 */
export class EducationProgramDetailsAPIOutDTO {
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

export class StudentEducationProgramAPIOutDTO {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeToDisplay: string;
  deliveryMethod: string;
}

export class EducationProgramsSummaryAPIOutDTO {
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

export class ProgramDeliveryTypes {
  deliveredOnSite: boolean;
  deliveredOnline: boolean;
}

export class EntranceRequirements {
  hasMinimumAge: boolean;
  minHighSchool: boolean;
  requirementsByInstitution: boolean;
  requirementsByBCITA: boolean;
}

/**
 * Complete program information used to create or
 * update an education program.
 **The validations will be applied during a form.io dryRun.
 */
export class EducationProgramAPIInDTO {
  @Allow()
  name: string;
  @Allow()
  description?: string;
  @Allow()
  credentialType: string;
  @Allow()
  cipCode: string;
  @Allow()
  nocCode: string;
  @Allow()
  sabcCode: string;
  @Allow()
  regulatoryBody: string;
  @Allow()
  programDeliveryTypes: ProgramDeliveryTypes;
  @Allow()
  deliveredOnlineAlsoOnsite?: string;
  @Allow()
  sameOnlineCreditsEarned?: string;
  @Allow()
  earnAcademicCreditsOtherInstitution?: string;
  @Allow()
  courseLoadCalculation: string;
  @Allow()
  completionYears: string;
  @Allow()
  eslEligibility: string;
  @Allow()
  hasJointInstitution: string;
  @Allow()
  hasJointDesignatedInstitution: string;
  @Allow()
  programIntensity: ProgramIntensity;
  @Allow()
  institutionProgramCode?: string;
  @Allow()
  minHoursWeek?: string;
  @Allow()
  isAviationProgram?: string;
  @Allow()
  minHoursWeekAvi?: string;
  @Allow()
  entranceRequirements: EntranceRequirements;
  @Allow()
  hasWILComponent: string;
  @Allow()
  isWILApproved?: string;
  @Allow()
  wilProgramEligibility?: string;
  @Allow()
  hasTravel: string;
  @Allow()
  travelProgramEligibility?: string;
  @Allow()
  hasIntlExchange?: string;
  @Allow()
  intlExchangeProgramEligibility?: string;
  @Allow()
  programDeclaration: boolean;
}

export class ApproveProgramAPIInDTO {
  effectiveEndDate: string;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  approvedNote: string;
}

export class DeclineProgramAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  declinedNote: string;
}
