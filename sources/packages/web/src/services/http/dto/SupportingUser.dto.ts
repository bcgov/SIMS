import { SupportingUserType } from "@/types";
import { ContactInformationAPIOutDTO } from "./Address.dto";

/**
 * Information used to uniquely identify a Student Application.
 * The application must be search using at least 3 criteria as
 * per defined by the Ministry policies.
 */
export interface ApplicationIdentifierAPIInDTO {
  applicationNumber: string;
  studentsDateOfBirth: string;
  studentsLastName: string;
}

/**
 * Data send to api to update a supporting user.
 */
export interface UpdateSupportingUserAPIInDTO
  extends ApplicationIdentifierAPIInDTO {
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

export interface ApplicationAPIOutDTO {
  programYearStartDate: string;
  formName: string;
}

export interface ApplicationSupportingUsersAPIOutDTO {
  supportingUserId: number;
  supportingUserType: SupportingUserType;
}

export interface SupportingUserFormDataAPIOutDTO {
  formName: string;
  supportingData: any;
  contactInfo: ContactInformationAPIOutDTO;
  sin: string;
  birthDate: string;
  email: string;
  firstName: string;
  lastName: string;
}
