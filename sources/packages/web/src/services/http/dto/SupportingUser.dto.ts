import { SupportingUserType } from "@/types";
import { ContactInformationAPIOutDTO } from "./Address.dto";

/**
 * Information used to uniquely identify a Student Application.
 * The application must be search using at least 3 criteria as
 * per defined by the Ministry policies.
 */
export interface ApplicationIdentifierApiInDTO {
  applicationNumber: string;
  studentsDateOfBirth: Date;
  studentsLastName: string;
}

/**
 * Data send to api to update a supporting user.
 */
export interface UpdateSupportingUserApiInDTO
  extends ApplicationIdentifierApiInDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  phone: string;
  postalCode: string;
  provinceState?: string;
  sin: string;
  supportingData: any;
}

export interface ApplicationApiOutDTO {
  programYearStartDate: Date;
  formName: string;
}

export interface ApplicationSupportingUsersApiOutDTO {
  supportingUserId: number;
  supportingUserType: SupportingUserType;
}

export interface SupportingUserFormDataApiOutDTO {
  formName: string;
  supportingData: any;
  contactInfo: ContactInformationAPIOutDTO;
  sin: string;
  birthDate: Date;
  gender: string;
  email: string;
  firstName: string;
  lastName: string;
}
