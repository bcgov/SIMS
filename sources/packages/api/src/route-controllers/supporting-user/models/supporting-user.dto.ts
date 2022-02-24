import { IsNotEmpty } from "class-validator";
import { SupportingUserType } from "src/database/entities";

/**
 * Information used to uniquely identify a Student Application.
 * The application must be search using at least 3 criteria as
 * per defined by the Ministry policies.
 */
export class ApplicationIdentifierDTO {
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
export interface UpdateSupportingUserDTO {
  applicationNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  phone: string;
  postalCode: string;
  provinceState: string;
  sin: string;
  studentsDateOfBirth: string;
  studentsLastName: string;
  supportingData: any;
}

export interface GetApplicationDTO {
  programYearStartDate: Date;
  formName: string;
}

export interface ApplicationSupportingUsersDTO {
  supportingUserId: number;
  supportingUserType: SupportingUserType;
}

export interface SupportingUserFormData {
  formName: string;
  formData: any;
}
