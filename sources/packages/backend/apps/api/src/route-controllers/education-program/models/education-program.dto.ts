import { Allow, IsDateString, IsNotEmpty, MaxLength } from "class-validator";
import {
  EntranceRequirements,
  ProgramDeliveryTypes,
} from "../../../services/education-program/education-program.service.models";
import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  ProgramStatus,
  ProgramIntensity,
} from "@sims/sims-db";

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
  otherRegulatoryBody?: string;
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
  @Allow()
  fieldOfStudyCode: number;
  /**
   * Indicates the institution type as BC Private. isBCPrivate is part of the form and defines if the dynamic
   * area of the form.io definition will be visible or not. It will impact the validation using the dryrun.
   * Since this value has the source of truth on the institution, it must be populated by the API prior to
   * the dryrun validation and it is part of DTO to make explicit its place in the form payload submitted.
   * It will also be ignored by Nestjs because it does not have a decorator.
   */
  isBCPrivate: boolean;
  /**
   * Indicates the institution type as BC Public. It follows the same reasoning as isBCPrivate.
   */
  isBCPublic: boolean;
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

export class DeactivateProgramAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}
