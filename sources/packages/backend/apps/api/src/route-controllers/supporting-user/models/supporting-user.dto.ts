import { IsNotEmpty, IsNotEmptyObject, IsOptional } from "class-validator";
import { ContactInfo, SupportingUserType } from "../../../database/entities";

/**
 * Information used to uniquely identify a Student Application.
 * The application must be search using at least 3 criteria as
 * per defined by the Ministry policies.
 */
export class ApplicationIdentifierApiInDTO {
  @IsNotEmpty()
  applicationNumber: string;
  @IsNotEmpty()
  studentsDateOfBirth: string;
  @IsNotEmpty()
  studentsLastName: string;
}

/**
 * Data required to update a supporting user.
 * The validation of the entire model will (and
 * must) be done by the Form.IO dry run.
 */
export class UpdateSupportingUserApiInDTO {
  @IsNotEmpty()
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
  studentsLastName: string;
  @IsNotEmptyObject()
  supportingData: any;
}

export class ApplicationApiOutDTO {
  programYearStartDate: Date;
  formName: string;
}

export class ApplicationSupportingUsersApiOutDTO {
  supportingUserId: number;
  supportingUserType: SupportingUserType;
}

export class SupportingUserFormDataApiOutDTO {
  formName: string;
  supportingData: any;
  contactInfo: ContactInfo;
  sin: string;
  birthDate: Date;
  gender: string;
  email: string;
  firstName: string;
  lastName: string;
}
