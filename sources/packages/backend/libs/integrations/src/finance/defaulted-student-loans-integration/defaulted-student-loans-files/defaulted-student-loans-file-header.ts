import {
  DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
  DefaultedStudentLoanRecordType,
  NUMBER_FILLER,
  SPACE_FILLER,
} from "../models/defaulted-student-loans-integration.model";
import { FixedFormatFileLine } from "../../../services/ssh";
import { SpecializedStringBuilder } from "@sims/utilities";

const FILLER_LENGTH = 1146;

export class DefaultedStudentLoansFileHeader implements FixedFormatFileLine {
  /**
   * Header record type.
   */
  private readonly recordType = DefaultedStudentLoanRecordType.Header;
  /**
   * Date of transmission.
   */
  transmissionDate: Date;
  /**
   * Unique number of the transmission to CLMB(Collections and Loans Management Branch).
   */
  transmissionNumber: number;
  /**
   * Unique ID number that identifies from where the transmission came.
   */
  private readonly transmissionSourceID = "STLDLLAB";
  /**
   * Description of the transmission.
   */
  private readonly transmissionDescription =
    "DEFAULTED DIRECT LEND STUDENT LOANS";

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
    header.appendStringWithFiller("", FILLER_LENGTH);
    return header.toString();
  }
}
