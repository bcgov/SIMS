import {
  DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
  DefaultedStudentLoanRecordType,
  FILE_DESCRIPTION,
  FILE_SOURCE_ID,
  NUMBER_FILLER,
  SPACE_FILLER,
} from "../models/defaulted-student-loans-integration.model";
import { IntegrationFileLine } from "../../../services/ssh";
import { SpecializedStringBuilder } from "@sims/utilities";

/**
 * Filler length.
 */
const FILLER_LENGTH = 1147;

export class DefaultedStudentLoansFileHeader extends IntegrationFileLine {
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
  private readonly transmissionSourceID = FILE_SOURCE_ID;
  /**
   * Description of the transmission.
   */
  private readonly transmissionDescription = FILE_DESCRIPTION;

  getContext(): Record<string, string | number | Date> {
    return {
      transmissionDate: this.transmissionDate || "NA",
      transmissionNumber: this.transmissionNumber || "NA",
    };
  }

  getFixedFormatLine(): string {
    const header = new SpecializedStringBuilder({
      numberFiller: NUMBER_FILLER,
      stringFiller: SPACE_FILLER,
      dateFormat: DEFAULTED_STUDENT_LOANS_DATE_FORMAT,
      dateFiller: SPACE_FILLER,
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
