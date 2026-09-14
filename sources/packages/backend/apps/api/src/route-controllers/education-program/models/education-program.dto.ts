import {
  ArrayMinSize,
  Equals,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";
import {
  EntranceRequirements,
  ProgramCalculatedDataKey,
  ProgramCourseLoadCalculationTypes,
  ProgramDeliveryTypes,
  ProgramDeliveryTypeValues,
  ProgramESLPercentage,
  ProgramEvaluationResult,
} from "../../../services/education-program/education-program.service.models";
import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  ProgramStatus,
  ProgramIntensity,
  AviationProgramCredentialTypes,
  CREDENTIAL_TYPE_MAX_LENGTH,
  CIP_CODE_MAX_LENGTH,
  PROGRAM_NAME_MAX_LENGTH,
  PROGRAM_DESCRIPTION_MAX_LENGTH,
  FormYesNoOptions,
  INSTITUTION_PROGRAM_CODE_MAX_LENGTH,
  INSTITUTION_REGULATORY_BODY_MAX_LENGTH,
  OTHER_REGULATORY_BODY_MAX_LENGTH,
  PROGRAM_COMPLETION_YEARS_MAX_LENGTH,
  LOOKUP_KEY_MAX_LENGTH,
} from "@sims/sims-db";
import { AllowIf, IsDateAfter } from "../../../utilities/class-validation";
import { getPSTPDTDateFormatted } from "@sims/utilities";
import {
  CIP_CODE_REGEX,
  NOC_REGEX,
  OTHER_REGULATORY_BODY,
  SABC_PROGRAM_CODE_REGEX,
} from "../../../services/education-program/constants";

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
  credentialTypesAviation?: AviationProgramCredentialTypes;
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
  isActive: boolean;
  isExpired: boolean;
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
  totalOfferings: number;
  submittedDate: Date;
  locationName: string;
  locationId: number;
  programStatus: ProgramStatus;
  isActive: boolean;
  isExpired: boolean;
}

export class EducationProgramsSummaryLocationAPIOutDTO {
  programId: number;
  programName: string;
  cipCode: string;
  sabcCode?: string;
  credentialType: string;
  totalOfferings: number;
  credentialTypeToDisplay: string;
  locationName: string;
  locationId: number;
  programStatus: ProgramStatus;
  isActive: boolean;
  isExpired: boolean;
}

export class ProgramEvaluationDataAPIInDTO {
  @IsOptional()
  @MaxLength(CREDENTIAL_TYPE_MAX_LENGTH)
  credentialType?: string;
  @IsOptional()
  @MaxLength(CIP_CODE_MAX_LENGTH)
  cipCode?: string;
}

export class ProgramEvaluationAPIInDTO {
  /**
   * Program evaluation data.
   */
  @IsNotEmptyObject()
  data: ProgramEvaluationDataAPIInDTO;
  /**
   * Keys of the calculated data to be evaluated.
   */
  @IsIn([ProgramCalculatedDataKey.FieldOfStudyCode], { each: true })
  calculatedDataKeys: ProgramCalculatedDataKey[];
}

export class ProgramEvaluationAPIOutDTO {
  calculatedData: ProgramEvaluationResult;
}

/**
 * Complete program information used to create or
 * update an education program.
 */
export class EducationProgramAPIInDTO {
  /**
   * Program name.
   */
  @IsNotEmpty()
  @MaxLength(PROGRAM_NAME_MAX_LENGTH)
  name: string;
  /**
   * Program description.
   */
  @ValidateIf((_, value: string) => !!value)
  @MaxLength(PROGRAM_DESCRIPTION_MAX_LENGTH)
  description?: string;
  /**
   * Credential type of the program.
   */
  @IsNotEmpty()
  @MaxLength(CREDENTIAL_TYPE_MAX_LENGTH)
  credentialType: string;
  /**
   * CIP code of the program.
   */
  @IsNotEmpty()
  @Matches(CIP_CODE_REGEX)
  cipCode: string;
  /**
   * NOC code of the program.
   */
  @ValidateIf((_, value: string) => !!value)
  @Matches(NOC_REGEX)
  nocCode?: string;
  /**
   * SABC code of the program.
   */
  @ValidateIf((_, value: string) => !!value)
  @Matches(SABC_PROGRAM_CODE_REGEX)
  sabcCode?: string;
  /**
   * Institution program code.
   */
  @ValidateIf((_, value: string) => !!value)
  @MaxLength(INSTITUTION_PROGRAM_CODE_MAX_LENGTH)
  institutionProgramCode?: string;
  /**
   * Program intensity.
   */
  @IsEnum(ProgramIntensity)
  programIntensity: ProgramIntensity;
  /**
   * Program delivery types.
   */
  @ArrayMinSize(1)
  @IsEnum(ProgramDeliveryTypeValues, { each: true })
  programDeliveryTypes: ProgramDeliveryTypeValues[];
  /**
   * Regulatory body of the program.
   */
  @IsNotEmpty()
  @MaxLength(INSTITUTION_REGULATORY_BODY_MAX_LENGTH)
  regulatoryBody: string;
  /**
   * The name of the other regulatory body.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value || EducationProgramAPIInDTO.isOtherRegulatoryBodyAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isOtherRegulatoryBodyAllowed)
  @MaxLength(OTHER_REGULATORY_BODY_MAX_LENGTH)
  otherRegulatoryBody?: string;
  /**
   * Indicates whether the program delivered online is also offered onsite.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value ||
      EducationProgramAPIInDTO.isDeliveredOnlineAlsoOnsiteAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isDeliveredOnlineAlsoOnsiteAllowed)
  @IsEnum(FormYesNoOptions)
  deliveredOnlineAlsoOnsite?: FormYesNoOptions;
  /**
   * Indicates whether the same online credits as onsite credits are earned for the program.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value ||
      EducationProgramAPIInDTO.isSameOnlineCreditsEarnedAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isSameOnlineCreditsEarnedAllowed)
  @IsEnum(FormYesNoOptions)
  sameOnlineCreditsEarned?: FormYesNoOptions;
  /**
   * Indicates whether the program earns academic credits from other institutions.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value ||
      EducationProgramAPIInDTO.isAcademicCreditsOtherInstitutionAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isAcademicCreditsOtherInstitutionAllowed)
  @IsEnum(FormYesNoOptions)
  earnAcademicCreditsOtherInstitution?: FormYesNoOptions;
  /**
   * Indicates the method used to calculate the program's course load.
   */
  @IsEnum(ProgramCourseLoadCalculationTypes)
  courseLoadCalculation: ProgramCourseLoadCalculationTypes;
  /**
   * Indicates if the program meets the minimum weekly hours requirement.
   */
  @IsOptional()
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value || EducationProgramAPIInDTO.isMinHoursWeekAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isMinHoursWeekAllowed)
  minHoursWeek?: FormYesNoOptions;
  /**
   * Indicates the number of years required to complete the program.
   */
  @IsNotEmpty()
  @MaxLength(PROGRAM_COMPLETION_YEARS_MAX_LENGTH)
  completionYears: string;
  /**
   * Indicates the ESL eligibility percentage for the program.
   */
  @IsEnum(ProgramESLPercentage)
  eslEligibility: ProgramESLPercentage;
  /**
   * Indicates whether the program has a joint institution.
   */
  @IsEnum(FormYesNoOptions)
  hasJointInstitution: FormYesNoOptions;
  /**
   * Indicates whether the program has joint institution(s) which are designated.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value ||
      EducationProgramAPIInDTO.isHasJointDesignatedInstitutionAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isHasJointDesignatedInstitutionAllowed)
  @IsEnum(FormYesNoOptions)
  hasJointDesignatedInstitution?: FormYesNoOptions;
  /**
   * Entrance requirements for the program.
   */
  @ArrayMinSize(1)
  @MaxLength(LOOKUP_KEY_MAX_LENGTH, { each: true })
  entranceRequirements: string[];
  /**
   * Indicates whether the program has a Work-Integrated Learning (WIL) component.
   */
  @IsEnum(FormYesNoOptions)
  hasWILComponent: FormYesNoOptions;
  /**
   * Indicates whether the Work-Integrated Learning (WIL) component is approved.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value || EducationProgramAPIInDTO.isWILApprovedAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isWILApprovedAllowed)
  @IsEnum(FormYesNoOptions)
  isWILApproved?: FormYesNoOptions;
  /**
   * Indicates whether the approved Work-Integrated Learning (WIL) component is eligible.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value || EducationProgramAPIInDTO.isWILProgramEligibilityAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isWILProgramEligibilityAllowed)
  @IsEnum(FormYesNoOptions)
  wilProgramEligibility?: FormYesNoOptions;
  /**
   * Indicates whether the program has a travel.
   */
  @IsEnum(FormYesNoOptions)
  hasTravel: FormYesNoOptions;
  /**
   * Indicates whether the travel program component is eligible.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value ||
      EducationProgramAPIInDTO.isTravelProgramEligibilityAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isTravelProgramEligibilityAllowed)
  @IsEnum(FormYesNoOptions)
  travelProgramEligibility?: FormYesNoOptions;
  /**
   * Indicates whether the program has an international exchange.
   */
  @IsEnum(FormYesNoOptions)
  hasIntlExchange: FormYesNoOptions;
  /**
   * Indicates whether the international exchange is eligible.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value || EducationProgramAPIInDTO.isIntlProgramEligibilityAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isIntlProgramEligibilityAllowed)
  @IsEnum(FormYesNoOptions)
  intlExchangeProgramEligibility?: FormYesNoOptions;
  /**
   * Indicates whether the program is an aviation program.
   */
  @IsEnum(FormYesNoOptions)
  isAviationProgram: FormYesNoOptions;
  /**
   * Aviation program credential types.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string[]) =>
      !!value?.length ||
      EducationProgramAPIInDTO.isCredentialTypesAviationAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isCredentialTypesAviationAllowed)
  @ArrayMinSize(1)
  @MaxLength(LOOKUP_KEY_MAX_LENGTH, { each: true })
  credentialTypesAviation?: string[];
  /**
   * Indicates if the aviation program has a minimum hours per week requirement.
   */
  @ValidateIf(
    (data: EducationProgramAPIInDTO, value: string) =>
      !!value || EducationProgramAPIInDTO.isMinHoursWeekAviAllowed(data),
  )
  @AllowIf(EducationProgramAPIInDTO.isMinHoursWeekAviAllowed)
  @IsEnum(FormYesNoOptions)
  minHoursWeekAvi?: FormYesNoOptions;
  @Equals(true)
  programDeclaration: boolean;
  @IsBoolean()
  isBCPrivate: boolean;
  @IsBoolean()
  isBCPublic: boolean;
  static isCredentialTypesAviationAllowed(
    data: EducationProgramAPIInDTO,
  ): boolean {
    return data.isAviationProgram === FormYesNoOptions.Yes;
  }
  static isMinHoursWeekAviAllowed(data: EducationProgramAPIInDTO): boolean {
    return data.isAviationProgram === FormYesNoOptions.Yes;
  }
  static isOtherRegulatoryBodyAllowed(data: EducationProgramAPIInDTO): boolean {
    return data.regulatoryBody === OTHER_REGULATORY_BODY;
  }
  static isDeliveredOnlineAlsoOnsiteAllowed(
    data: EducationProgramAPIInDTO,
  ): boolean {
    return (
      !data.isBCPrivate &&
      !data.isBCPublic &&
      data.programDeliveryTypes?.includes(ProgramDeliveryTypeValues.Online)
    );
  }
  static isSameOnlineCreditsEarnedAllowed(
    data: EducationProgramAPIInDTO,
  ): boolean {
    return (
      !data.isBCPrivate &&
      !data.isBCPublic &&
      data.deliveredOnlineAlsoOnsite === FormYesNoOptions.No
    );
  }
  static isAcademicCreditsOtherInstitutionAllowed(
    data: EducationProgramAPIInDTO,
  ): boolean {
    return (
      !data.isBCPrivate &&
      !data.isBCPublic &&
      data.deliveredOnlineAlsoOnsite === FormYesNoOptions.No &&
      data.sameOnlineCreditsEarned === FormYesNoOptions.No
    );
  }
  static isMinHoursWeekAllowed(data: EducationProgramAPIInDTO): boolean {
    return (
      data.courseLoadCalculation === ProgramCourseLoadCalculationTypes.Hours
    );
  }
  static isHasJointDesignatedInstitutionAllowed(
    data: EducationProgramAPIInDTO,
  ): boolean {
    return data.hasJointInstitution === FormYesNoOptions.Yes;
  }
  static isWILApprovedAllowed(data: EducationProgramAPIInDTO): boolean {
    return data.hasWILComponent === FormYesNoOptions.Yes;
  }
  static isWILProgramEligibilityAllowed(
    data: EducationProgramAPIInDTO,
  ): boolean {
    return (
      data.hasWILComponent === FormYesNoOptions.Yes &&
      data.isWILApproved === FormYesNoOptions.Yes
    );
  }
  static isTravelProgramEligibilityAllowed(
    data: EducationProgramAPIInDTO,
  ): boolean {
    return data.hasTravel === FormYesNoOptions.Yes;
  }
  static isIntlProgramEligibilityAllowed(
    data: EducationProgramAPIInDTO,
  ): boolean {
    return data.hasIntlExchange === FormYesNoOptions.Yes;
  }
}

export class ApproveProgramAPIInDTO {
  @IsDateString()
  @IsDateAfter(() => getPSTPDTDateFormatted(new Date()), "Expiry date")
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

/**
 * DTO to display pending education programs.
 */
export class EducationProgramPendingAPIOutDTO {
  id: number;
  programName: string;
  institutionOperatingName: string;
  submittedDate: Date;
  institutionId: number;
  selectedLocationId: number;
}
