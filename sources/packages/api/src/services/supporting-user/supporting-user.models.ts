import { ContactInfo } from "../../types";

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
   * SIN provided by the supporting user.
   */
  sin: string;
  /**
   * Birth date present on the supporting user
   * authentication information.
   */
  birthDate: string;
  /**
   * Gender present on the the supporting user
   * authentication information.
   */
  gender: string;
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
