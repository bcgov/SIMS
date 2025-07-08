import { ContactInfo, FormYesNoOptions } from "@sims/sims-db";

/**
 * Represents the information that must be updated
 * altogether when a supporting user is providing
 * the supporting data for a Student Application.
 */
export interface UpdateSupportingUserInfo {
  /**
   * Contact information provided by the
   * supporting user.
   */
  contactInfo: ContactInfo;
  /**
   * Indicates if the supporting user has a valid SIN.
   * The valid SIN indicator is introduced from program year 2025-2026 onwards
   * and hence is not available for program years prior to 2025-2026.
   */
  hasValidSIN?: FormYesNoOptions;
  /**
   * SIN provided by the supporting user.
   * If the supporting user does not have a valid SIN,
   * this field must be empty.
   */
  sin?: string;
  /**
   * Birth date present on the supporting user
   * authentication information.
   */
  birthDate: string;
  /**
   * Additional questions answered by
   * the supporting user. This is a
   * dynamic field.
   */
  supportingData: any;
  /**
   * Id of the user that represents this
   * supporting user.
   */
  userId: number;
}

export interface ReportedSupportingUserData {
  givenNames?: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  phone: string;
  postalCode: string;
  provinceState: string;
  supportingData: Record<string, unknown>;
}
