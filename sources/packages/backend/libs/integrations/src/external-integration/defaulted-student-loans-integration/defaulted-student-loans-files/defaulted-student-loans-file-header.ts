import {
  DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
  DefaultedStudentLoanRecordType,
  NUMBER_FILLER,
  SPACE_FILLER,
} from "../models/defaulted-student-loans-integration.model";
import { FixedFormatFileLine } from "../../../services/ssh";
import { SpecializedStringBuilder } from "@sims/utilities";

export class DefaultedStudentLoansFileHeader implements FixedFormatFileLine {
  /**
   * Header record type.
   */
  recordType: DefaultedStudentLoanRecordType.Header;
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
    header.appendOptionalStringWithFiller(this.filler, 1146);
    return header.toString();
  }
}
