import { DefaultedStudentLoanRecordType } from "../models/defaulted-student-loans-integration.model";
import { FixedFormatFileLine } from "../../../services/ssh";

export class DefaultedStudentLoansFileDetail implements FixedFormatFileLine {
  /**
   * Detail record type.
   */
  private readonly recordType = DefaultedStudentLoanRecordType.Detail;

  clientID: string;

  sinIndicator: string;

  clientType: string;

  ownerCode: string;

  nameType: string;

  lastName: string;

  firstName: string;

  middleNames: string;

  initials: string;

  birthDate: string;

  gender: string;

  email: string;

  addressType: string;

  addressEffectiveDate: string;

  addressEndDate: string;

  addressName: string;

  addressLine1: string;

  addressLine2: string;

  city: string;

  province: string;

  country: string;

  postalCode: string;

  homePhone: string;

  businessPhone: string;

  getFixedFormat(): string {
    return "";
  }
}
