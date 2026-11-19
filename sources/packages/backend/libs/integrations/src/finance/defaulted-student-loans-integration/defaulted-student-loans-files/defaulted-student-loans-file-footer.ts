import {
  DefaultedStudentLoanRecordType,
  DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
  FILE_SOURCE_ID,
  FILE_DESCRIPTION,
  NUMBER_FILLER,
  SPACE_FILLER,
} from "../models/defaulted-student-loans-integration.model";
import { SpecializedStringBuilder, decimalRound } from "@sims/utilities";
import { IntegrationFileLine } from "../../../services/ssh";

/**
 * Filler length.
 */
const FILLER_LENGTH = 1119;

export class DefaultedStudentLoansFileFooter extends IntegrationFileLine {
  /**
   * Footer record type.
   */
  private readonly recordType = DefaultedStudentLoanRecordType.Footer;
  /**
   * Date of transmission.
   */
  transmissionDate: Date;
  /**
   * Unique number of the transmission to CLMB(to Collections and Loans Management Branch).
   */
  transmissionNumber: number;
  /**
   * Unique ID number that identifies from where the transmission came.
   */
  private readonly transmissionSourceID = FILE_SOURCE_ID;
  /**
   * Description of the transmission.
   */
  private readonly transmissionDescription = FILE_DESCRIPTION;
  /**
   * Total number of detail records in the transmission.
   */
  recordCount: number;
  /**
   * Total BOA(Balance on account) dollar value in the transmission.
   */
  totalBOAValue: number;
  /**
   * Indicates if the total BOA value is negative.
   */
  isTotalBOAValueNegative: boolean;

  getContext(): Record<string, string | number | Date> {
    return {
      transmissionDate: this.transmissionDate || "NA",
      transmissionNumber: this.transmissionNumber || "NA",
    };
  }

  getFixedFormatLine(): string {
    const footer = new SpecializedStringBuilder({
      numberFiller: NUMBER_FILLER,
      stringFiller: SPACE_FILLER,
      dateFormat: DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
      dateFiller: SPACE_FILLER,
    });
    footer.append(this.recordType);
    footer.appendFormattedDate(this.transmissionDate);
    footer.appendNumberWithFiller(this.transmissionNumber, 10);
    footer.appendStringWithFiller(this.transmissionSourceID, 10);
    footer.appendStringWithFiller(this.transmissionDescription, 80);
    footer.appendNumberWithFiller(this.recordCount, 11);
    footer.appendNumberWithFiller(
      decimalRound(this.totalBOAValue).toFixed(2),
      16,
    );
    footer.appendStringWithFiller(this.isTotalBOAValueNegative ? "-" : "", 1);
    footer.appendStringWithFiller("", FILLER_LENGTH);
    return footer.toString();
  }
}
