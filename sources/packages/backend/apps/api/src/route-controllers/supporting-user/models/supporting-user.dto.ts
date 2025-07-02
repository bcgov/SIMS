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
  OfferingIntensity,
  SupportingUserType,
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
  
  // For partner search: use student's date of birth
  @ValidateIf((o) => o.supportingUserType === SupportingUserType.Partner)
  @IsNotEmpty()
  studentsDateOfBirth: string;
  
  // For parent search: use parent's full name
  @ValidateIf((o) => o.supportingUserType === SupportingUserType.Parent)
  @IsNotEmpty()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  parentFullName: string;
  
  @IsEnum(SupportingUserType)
  supportingUserType: SupportingUserType;
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
  @IsNotEmpty()
  sin: string;
  @IsNotEmpty()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  studentsLastName: string;
  @IsNotEmptyObject()
  @JsonMaxSize(JSON_10KB)
  supportingData: unknown;
  @IsEnum(OfferingIntensity)
  offeringIntensity: OfferingIntensity;
  
  // For partner search: use student's date of birth
  @ValidateIf((o) => o.supportingUserType === SupportingUserType.Partner)
  @IsNotEmpty()
  studentsDateOfBirth: string;
  
  // For parent search: use parent's full name
  @ValidateIf((o) => o.supportingUserType === SupportingUserType.Parent)
  @IsNotEmpty()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  parentFullName: string;
  
  @IsEnum(SupportingUserType)
  supportingUserType: SupportingUserType;
}

export class ApplicationAPIOutDTO {
  programYearStartDate: string;
  formName: string;
  offeringIntensity: OfferingIntensity;
}

export class SupportingUserFormDataAPIOutDTO {
  formName: string;
  supportingData: unknown;
  contactInfo: ContactInfo;
  sin: string;
  birthDate: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class StudentSupportingUserAPIOutDTO {
  fullName: string;
  formName: string;
}
