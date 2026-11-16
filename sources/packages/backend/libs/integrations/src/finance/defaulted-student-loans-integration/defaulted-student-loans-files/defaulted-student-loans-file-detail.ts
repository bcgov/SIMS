import {
  BalanceTypeItem,
  DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
  DefaultedStudentLoanBalanceType,
  DefaultedStudentLoanRecordType,
  NUMBER_FILLER,
  SPACE_FILLER,
} from "../models/defaulted-student-loans-integration.model";
import { FixedFormatFileLine } from "../../../services/ssh";
import { decimalRound, SpecializedStringBuilder } from "@sims/utilities";
import { YNFlag } from "../../../models";

/**
 * Length of a balance type element in the defaulted student loans file.
 */
const BALANCE_TYPE_ELEMENT_LENGTH = 41;

/**
 * Length of the free area filler in the defaulted student loans file.
 */
const FREE_AREA_FILLER_LENGTH = 100;

/**
 * Total number of balance type elements expected in the defaulted student loans file.
 */
const TOTAL_BALANCE_TYPE_ELEMENTS = 8;
/**
 * Map of balance types to their corresponding calculate interest flag.
 * This determines whether interest should be calculated for each balance type.
 */
export const CALCULATE_INTEREST_FLAG_MAP = new Map<
  DefaultedStudentLoanBalanceType,
  YNFlag
>([
  [DefaultedStudentLoanBalanceType.BOA, YNFlag.N],
  [DefaultedStudentLoanBalanceType.PRN, YNFlag.Y],
  [DefaultedStudentLoanBalanceType.INT, YNFlag.N],
  [DefaultedStudentLoanBalanceType.EXP, YNFlag.N],
  [DefaultedStudentLoanBalanceType.DIN, YNFlag.Y],
  [DefaultedStudentLoanBalanceType.PDB, YNFlag.Y],
]);

export class DefaultedStudentLoansFileDetail implements FixedFormatFileLine {
  /**
   * Detail record type.
   */
  private readonly recordType = DefaultedStudentLoanRecordType.Detail;
  /**
   * Unique identifier of designated account owner.
   */
  clientID: string;
  /**
   * Single character flag to establish the relationship of client number to a person's SIN.
   * S - Social Insurance Number.
   */
  private readonly sinIndicator = "S";
  /**
   * Type of client.
   * I - Individual client.
   */
  private readonly clientType = "I";
  /**
   * Type of relationship between the client and the Account.
   * D - Designated owner.
   */
  private readonly ownerCode = "D";
  /**
   * Type of name.
   * L - Legal name.
   */
  private readonly nameType = "L";
  /**
   * Current last name of client.
   */
  lastName: string;
  /**
   * Current first name of client.
   */
  firstName?: string;
  /**
   * Current middle names of client. Names are separated by spaces.
   * Field value mapping TBD, populated with filler.
   */
  middleNames?: string;
  /**
   * Current initials of client.
   */
  initials?: string;
  /**
   * Date of birth of the client.
   */
  birthDate: Date;
  /**
   * Current gender of the client.
   */
  gender: string;
  /**
   * Email address of the client.
   * Field value mapping TBD, populated with filler.
   */
  email?: string;
  /**
   * Client address type.
   * M - Mailing address.
   */
  private readonly addressType = "M";
  /**
   * The date in which the address becomes effective.
   */
  addressEffectiveDate: Date | null;
  /**
   * The date when the address is no longer valid.
   * Field value mapping TBD, populated with filler.
   */
  addressEndDate?: Date;
  /**
   * The name that should appear on mail outs for this address.  This includes 'In Care Of' addresses.
   * Field value mapping TBD, populated with filler.
   */
  addressName?: string;
  /**
   * Address information line 1.
   */
  addressLine1: string;
  /**
   * Address information line 2.
   */
  addressLine2?: string;
  /**
   * City of the address.
   */
  city: string;
  /**
   * Province of the address.
   */
  province: string;
  /**
   * Country of the address.
   */
  country: string;
  /**
   * Postal code of the address.
   */
  postalCode: string;
  /**
   * Home phone number of the address.
   */
  homePhone?: string;
  /**
   * Business phone number of the address.
   * Field value mapping TBD, populated with filler.
   */
  businessPhone?: string;
  /**
   * Unique file/account identifier for this account.
   * Field value mapping TBD, populated with filler.
   */
  fileId?: string;
  /**
   * Status of the account.
   * 005 - BANKRUPTCY SECURED.
   * 030 - UNSECURED.
   * 010 - Orderly Payment of Debt - OPD.
   * Field value mapping TBD, populated with filler.
   */
  accountStatus?: 5 | 30 | 10;
  /**
   * Sub-status of the account.
   * Field value mapping TBD, populated with filler.
   */
  accountSubStatus?: number;
  /**
   * Original debt for the account.
   * Field value mapping TBD, populated with filler.
   */
  private readonly originalBalance = 0;
  /**
   * Date when the original debt became due and payable.
   * Field value mapping TBD, populated with filler.
   */
  originalDueDate?: Date;
  /**
   * Array of populated balance type items for the loan.
   * Currently the balance type BOA, PRN, INT, EXP, and DIN are expected to be included.
   */
  populatedBalanceTypeItems: BalanceTypeItem[];
  /**
   * Date when a student loan enters repayment.
   */
  consolidationDate: Date;
  /**
   * Next payment due date before a loan is defaulted.
   */
  eventDate: Date;

  getFixedFormat(): string {
    const detail = new SpecializedStringBuilder({
      numberFiller: NUMBER_FILLER,
      stringFiller: SPACE_FILLER,
      dateFormat: DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
    });
    detail.append(this.recordType);
    detail.appendStringWithFiller(this.clientID, 30);
    detail.append(this.sinIndicator);
    detail.append(this.clientType);
    detail.append(this.ownerCode);
    detail.append(this.nameType);
    detail.appendStringWithFiller(this.lastName, 40);
    detail.appendOptionalStringWithFiller(this.firstName, 20);
    detail.appendOptionalStringWithFiller(this.middleNames, 40);
    detail.appendOptionalStringWithFiller(this.initials, 6);
    detail.appendFormattedDate(this.birthDate);
    detail.append(this.gender);
    detail.appendOptionalStringWithFiller(this.email, 65);
    detail.append(this.addressType);
    detail.appendOptionalFormattedDate(this.addressEffectiveDate);
    detail.appendOptionalFormattedDate(this.addressEndDate);
    detail.appendOptionalStringWithFiller(this.addressName, 65);
    detail.appendStringWithFiller(this.addressLine1, 50);
    detail.appendOptionalStringWithFiller(this.addressLine2, 50);
    detail.appendStringWithFiller(this.city, 50);
    detail.appendStringWithFiller(this.province, 50);
    detail.appendStringWithFiller(this.country, 50);
    detail.appendStringWithFiller(this.postalCode, 10);
    detail.appendOptionalStringWithFiller(this.homePhone, 15);
    detail.appendOptionalStringWithFiller(this.businessPhone, 15);
    detail.appendOptionalStringWithFiller(this.fileId, 30);
    detail.appendOptionalNumberWithFiller(this.accountStatus, 3);
    detail.appendOptionalNumberWithFiller(this.accountSubStatus, 3);
    detail.appendNumberWithFiller(this.originalBalance.toFixed(2), 14);
    detail.append(this.originalBalance < 0 ? "-" : SPACE_FILLER);
    detail.appendOptionalFormattedDate(this.originalDueDate);
    this.populatedBalanceTypeItems.forEach((balanceTypeItem) => {
      this.appendBalanceTypeItem(detail, balanceTypeItem);
    });
    // The file has space for 8 balance type elements but only 5 of them are currently mapped by the system.
    // Hence remaining balance type elements should be filled with space.
    for (
      let i = 0;
      i < TOTAL_BALANCE_TYPE_ELEMENTS - this.populatedBalanceTypeItems.length;
      i++
    ) {
      detail.appendStringWithFiller("", BALANCE_TYPE_ELEMENT_LENGTH);
    }
    // Append free area filler.
    detail.appendStringWithFiller("", FREE_AREA_FILLER_LENGTH);
    detail.appendFormattedDate(this.consolidationDate);
    detail.appendFormattedDate(this.eventDate);
    return detail.toString();
  }

  /**
   * Appends a balance type item to the string builder.
   * @param stringBuilder The string builder to append the balance type item to.
   * @param balanceTypeItem The balance type item to append to the string builder.
   */
  private appendBalanceTypeItem(
    stringBuilder: SpecializedStringBuilder,
    balanceTypeItem: BalanceTypeItem,
  ): void {
    const roundedBalance = decimalRound(balanceTypeItem.balanceAmount);
    // Convert interest rate percentage to value.
    // e.g., 1.2% => 0.012.
    const interestRateValue = balanceTypeItem.interestRate / 100;
    stringBuilder.append(balanceTypeItem.balanceType);
    stringBuilder.appendNumberWithFiller(roundedBalance.toFixed(2), 14);
    stringBuilder.append(roundedBalance < 0 ? "-" : SPACE_FILLER);
    stringBuilder.append(
      decimalRound(interestRateValue, 5).toFixed(5).substring(1),
    );
    stringBuilder.append(balanceTypeItem.interestFormulaCode);
    stringBuilder.append(balanceTypeItem.interestType);
    stringBuilder.append(balanceTypeItem.shouldCalculateInterest);
    stringBuilder.append(balanceTypeItem.shouldOverrideInterestRate);
    stringBuilder.append(balanceTypeItem.shouldReportInterest);
    stringBuilder.appendFormattedDate(balanceTypeItem.interestCalculationDate);
  }
}
