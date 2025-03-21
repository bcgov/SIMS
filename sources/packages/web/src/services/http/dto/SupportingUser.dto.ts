import { OfferingIntensity, SupportingUserType } from "@/types";
import { ContactInformationAPIOutDTO } from "./Address.dto";
import { Expose } from "class-transformer";

/**
 * Information used to uniquely identify a Student Application.
 * The application must be search using at least 3 criteria as
 * per defined by the Ministry policies.
 */
export class ApplicationIdentifierAPIInDTO {
  @Expose()
  applicationNumber: string;
  @Expose()
  studentsDateOfBirth: string;
  @Expose()
  studentsLastName: string;
}

/**
 * Data send to api to update a supporting user.
 */
export class UpdateSupportingUserAPIInDTO extends ApplicationIdentifierAPIInDTO {
  @Expose()
  addressLine1: string;
  @Expose()
  addressLine2?: string;
  @Expose()
  city: string;
  @Expose()
  country: string;
  @Expose()
  phone: string;
  @Expose()
  postalCode: string;
  @Expose()
  provinceState?: string;
  @Expose()
  sin: string;
  @Expose()
  supportingData: unknown;
  @Expose()
  offeringIntensity: OfferingIntensity;
}

export interface ApplicationAPIOutDTO {
  programYearStartDate: string;
  formName: string;
  offeringIntensity: OfferingIntensity;
}

export interface ApplicationSupportingUsersAPIOutDTO {
  supportingUserId: number;
  supportingUserType: SupportingUserType;
}

export interface SupportingUserFormDataAPIOutDTO {
  formName: string;
  supportingData: unknown;
  contactInfo: ContactInformationAPIOutDTO;
  sin: string;
  birthDate: string;
  email: string;
  firstName: string;
  lastName: string;
}
