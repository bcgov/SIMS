import {
  DefaultedStudentLoanRecordType,
  DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
} from "../models/defaulted-student-loans-integration.model";
import {
  NUMBER_FILLER,
  SPACE_FILLER,
} from "@sims/integrations/institution-integration/ier12-integration";
import { SpecializedStringBuilder, decimalRound } from "@sims/utilities";
import { FixedFormatFileLine } from "../../../services/ssh";

export class DefaultedStudentLoansFileFooter implements FixedFormatFileLine {
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
  transmissionSourceID: string;
  /**
   * Description of the transmission.
   */
  transmissionDescription: string;
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
  /**
   * Filler for the header record.
   */
  filler: string;
  getFixedFormat(): string {
    const header = new SpecializedStringBuilder({
      numberFiller: NUMBER_FILLER,
      stringFiller: SPACE_FILLER,
      dateFormat: DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
    });
    header.append(this.recordType);
    header.appendFormattedDate(this.transmissionDate);
    header.appendNumberWithFiller(this.transmissionNumber, 10);
    header.appendStringWithFiller(this.transmissionSourceID, 10);
    header.appendStringWithFiller(this.transmissionDescription, 80);
    header.appendNumberWithFiller(this.recordCount, 11);
    header.appendNumberWithFiller(
      decimalRound(this.totalBOAValue).toFixed(2),
      16,
    );
    header.appendStringWithFiller(this.isTotalBOAValueNegative ? "-" : "", 1);
    header.appendOptionalStringWithFiller(this.filler, 1118);
    return header.toString();
  }
}
