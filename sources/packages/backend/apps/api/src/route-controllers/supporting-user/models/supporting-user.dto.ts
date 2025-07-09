import {
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  Length,
  MaxLength,
  ValidateIf,
} from "class-validator";
import {
  ContactInfo,
  APPLICATION_NUMBER_LENGTH,
  USER_LAST_NAME_MAX_LENGTH,
  SUPPORTING_USER_FULL_NAME_MAX_LENGTH,
  SupportingUserType,
  OfferingIntensity,
  FormYesNoOptions,
} from "@sims/sims-db";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { JSON_10KB } from "../../../constants";

/**
 * Information used to uniquely identify a Student Application.
 * The application must be search using at least 3 criteria as
 * per defined by the Ministry policies.
 */
export class ApplicationIdentifierAPIInDTO {
  @Length(APPLICATION_NUMBER_LENGTH, APPLICATION_NUMBER_LENGTH)
  applicationNumber: string;
  @IsNotEmpty()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  studentsLastName: string;
  @IsEnum(SupportingUserType)
  supportingUserType: SupportingUserType;
  /**
   * For Parent search only. Required for Parent, Optional for Partner.
   */
  @ValidateIf(
    (object: UpdateSupportingUserAPIInDTO) =>
      object.supportingUserType === SupportingUserType.Parent,
  )
  @IsNotEmpty()
  @MaxLength(SUPPORTING_USER_FULL_NAME_MAX_LENGTH)
  fullName?: string;
  /**
   * For Partner search only. Optional for Parent.
   */
  @ValidateIf(
    (object: UpdateSupportingUserAPIInDTO) =>
      object.supportingUserType === SupportingUserType.Partner,
  )
  @IsNotEmpty()
  studentsDateOfBirth?: string;
}

/**
 * Data required to update a supporting user.
 * The validation of the entire model will (and
 * must) be done by the Form.IO dry run.
 */
export class UpdateSupportingUserAPIInDTO {
  @Length(APPLICATION_NUMBER_LENGTH, APPLICATION_NUMBER_LENGTH)
  applicationNumber: string;
  @IsNotEmpty()
  addressLine1: string;
  @IsOptional()
  addressLine2: string;
  @IsNotEmpty()
  city: string;
  @IsNotEmpty()
  country: string;
  @IsNotEmpty()
  phone: string;
  @IsNotEmpty()
  postalCode: string;
  @IsOptional()
  provinceState?: string;
  @IsOptional()
  sin?: string;
  @IsNotEmpty()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  studentsLastName: string;
  @IsEnum(SupportingUserType)
  supportingUserType: SupportingUserType;
  /**
   * For Parent search only. Optional for Partner.
   */
  @ValidateIf(
    (object: UpdateSupportingUserAPIInDTO) =>
      object.supportingUserType === SupportingUserType.Parent,
  )
  @IsNotEmpty()
  @MaxLength(SUPPORTING_USER_FULL_NAME_MAX_LENGTH)
  fullName?: string;
  /**
   * For Partner search only. Optional for Parent.
   */
  @ValidateIf(
    (object: UpdateSupportingUserAPIInDTO) =>
      object.supportingUserType === SupportingUserType.Partner,
  )
  @IsNotEmpty()
  studentsDateOfBirth?: string;
  @IsNotEmptyObject()
  @JsonMaxSize(JSON_10KB)
  supportingData: unknown;
  @IsEnum(OfferingIntensity)
  offeringIntensity: OfferingIntensity;
  @IsOptional()
  @IsEnum(FormYesNoOptions)
  hasValidSIN?: FormYesNoOptions;
}

export class ApplicationAPIOutDTO {
  programYearStartDate: string;
  formName: string;
  offeringIntensity: OfferingIntensity;
}

export class SupportingUserFormDataAPIOutDTO {
  formName: string;
  isAbleToReport: boolean;
  supportingData: unknown;
  contactInfo: ContactInfo;
  sin: string;
  birthDate: string;
  email: string;
  firstName: string;
  lastName: string;
  hasValidSIN?: FormYesNoOptions;
}

/**
 * Supporting user details of the supporting user who is unable to report.
 */
export class ReportedSupportingUserAPIOutDTO {
  fullName: string;
  formName: string;
  isAbleToReport: boolean;
  programYearStartDate: string;
}

/**
 * Details to update the supporting user who is unable to report.
 */
export class ReportedSupportingUserAPIInDTO {
  @IsOptional()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  givenNames?: string;
  @IsNotEmpty()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  lastName: string;
  @IsNotEmpty()
  addressLine1: string;
  @IsOptional()
  addressLine2?: string;
  @IsNotEmpty()
  city: string;
  @IsNotEmpty()
  country: string;
  @IsNotEmpty()
  phone: string;
  @IsNotEmpty()
  postalCode: string;
  @IsNotEmpty()
  provinceState: string;
  @IsNotEmptyObject()
  @JsonMaxSize(JSON_10KB)
  supportingData: Record<string, unknown>;
}
