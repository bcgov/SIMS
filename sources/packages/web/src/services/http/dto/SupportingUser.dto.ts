import {
  FormYesNoOptions,
  OfferingIntensity,
  SupportingUserType,
} from "@/types";
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
  studentsLastName: string;
  @Expose()
  supportingUserType: SupportingUserType;
  /**
   * For Parent search only. Optional for Partner.
   */
  @Expose()
  fullName?: string;
  /**
   * For Partner search only. Optional for Parent.
   */
  @Expose()
  studentsDateOfBirth?: string;
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
  @Expose()
  hasValidSIN?: FormYesNoOptions;
}

export interface ApplicationAPIOutDTO {
  programYearStartDate: string;
  formName: string;
  offeringIntensity: OfferingIntensity;
}

export interface SupportingUserFormDataAPIOutDTO {
  formName: string;
  isAbleToReport: boolean;
  supportingData: unknown;
  contactInfo: ContactInformationAPIOutDTO;
  sin: string;
  birthDate: string;
  email: string;
  firstName: string;
  lastName: string;
  personalInfo: SupportingUserPersonalInfo;
  parentFullName: string;
}

export class SupportingUserPersonalInfo {
  @Expose()
  givenNames?: string;
  @Expose()
  lastName?: string;
  @Expose()
  hasValidSIN?: FormYesNoOptions;
}
/**
 * Supporting user details of the supporting user who is unable to report.
 */
export interface ReportedSupportingUserAPIOutDTO {
  fullName: string;
  formName: string;
  isAbleToReport: boolean;
  programYearStartDate: string;
}

/**
 * Details to update the supporting user who is unable to report.
 */
export class ReportedSupportingUserAPIInDTO {
  @Expose()
  givenNames?: string;
  @Expose()
  lastName: string;
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
  provinceState: string;
  @Expose()
  supportingData: Record<string, unknown>;
}
