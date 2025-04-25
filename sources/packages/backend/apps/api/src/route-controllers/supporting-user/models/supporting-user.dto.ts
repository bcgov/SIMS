import {
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  Length,
  MaxLength,
} from "class-validator";
import {
  ContactInfo,
  APPLICATION_NUMBER_LENGTH,
  USER_LAST_NAME_MAX_LENGTH,
  OfferingIntensity,
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
  studentsDateOfBirth: string;
  @IsNotEmpty()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  studentsLastName: string;
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
  studentsDateOfBirth: string;
  @IsNotEmpty()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  studentsLastName: string;
  @IsNotEmptyObject()
  @JsonMaxSize(JSON_10KB)
  supportingData: unknown;
  @IsEnum(OfferingIntensity)
  offeringIntensity: OfferingIntensity;
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
