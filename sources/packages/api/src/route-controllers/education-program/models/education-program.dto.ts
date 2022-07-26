import { Allow, IsDateString, IsNotEmpty, MaxLength } from "class-validator";
import {
  EntranceRequirements,
  ProgramDeliveryTypes,
} from "../../../services/education-program/education-program.service.models";
import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  ProgramStatus,
} from "../../../database/entities";
import { ProgramIntensity } from "../../../database/entities/program-intensity.type";

/**
 * Education program complete information.
 * Shared between the Ministry and the Institution.
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
  submittedDate: Date;
  submittedBy: string;
  assessedDate?: Date;
  assessedBy?: string;
  effectiveEndDate?: string;
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
  @IsDateString()
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
