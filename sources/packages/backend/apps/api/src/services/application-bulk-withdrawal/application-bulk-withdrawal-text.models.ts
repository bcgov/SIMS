import { Contains, IsDate, Length } from "class-validator";
import { APPLICATION_NUMBER_LENGTH } from "@sims/sims-db";
import { IsValidSIN } from "../../utilities/class-validation";
import { getDateOnlyFromFormat } from "@sims/utilities";

export const DATE_FORMAT = "YYYYMMDD";
/**
 * user-friendly header names used in the text to be populated by the user.
 * The text model parser uses this as a base to parse the text string into an object model.
 */
export const DataTextHeaders = {
  recordType: "Record Type",
  sin: "SIN",
  applicationNumber: "Application Number",
  withdrawalDate: "Withdrawal Date",
};

export enum RecordType {
  ApplicationBulkWithdrawalHeaderRecordType = "1",
  ApplicationBulkWithdrawalDataRecordType = "2",
  ApplicationBulkWithdrawalFooterRecordType = "3",
}

export class ApplicationWithdrawalTextModel {
  /**
   * Data record type.
   */
  @Contains(RecordType.ApplicationBulkWithdrawalDataRecordType, {
    message: `${DataTextHeaders.recordType} must be valid.`,
  })
  recordType: RecordType;
  /**
   * SIN.
   */
  @IsValidSIN({
    message: `${DataTextHeaders.sin} must be a valid SIN.`,
  })
  sin: string;
  /**
   * Application Number.
   */
  @Length(APPLICATION_NUMBER_LENGTH, APPLICATION_NUMBER_LENGTH, {
    message: `${DataTextHeaders.applicationNumber} must be a valid application number.`,
  })
  applicationNumber: string;
  /**
   * Withdrawal Date.
   */
  @IsDate({
    message: `${DataTextHeaders.withdrawalDate} must be a valid withdrawal date.`,
  })
  withdrawalDate: Date;
}

/**
 * Represents the validation performed on a text model.
 */
export interface ApplicationWithdrawalTextValidationResult {
  /**
   * Zero base index of the record in the list of the records.
   * Does not consider possible header.
   */
  index: number;
  /**
   * Model that was validated.
   */
  textModel: ApplicationWithdrawalTextModel;
  /**
   * List of possible errors. If no error is present it
   * means the model was successfully validated.
   */
  errors: string[];
}

export class ApplicationBulkWithdrawalHeader {
  recordType: RecordType;
  originator: string;
  title: string;
  creationDate: Date;
  public static createFromLine(line: string): ApplicationBulkWithdrawalHeader {
    const header = new ApplicationBulkWithdrawalHeader();
    header.recordType = line.substring(0, 1) as RecordType;
    header.originator = line.substring(1, 5);
    header.title = line.substring(5, 20);
    header.creationDate = getDateOnlyFromFormat(
      line.substring(20, 28),
      DATE_FORMAT,
    );
    return header;
  }
}
export class ApplicationBulkWithdrawalData {
  recordType: RecordType;
  sin: string;
  applicationNumber: string;
  withdrawalDate: Date;
  public static createFromLine(line: string): ApplicationBulkWithdrawalData {
    const record = new ApplicationBulkWithdrawalData();
    record.recordType = line.substring(0, 1) as RecordType;
    record.sin = line.substring(1, 10);
    record.applicationNumber = line.substring(10, 20);
    record.withdrawalDate = getDateOnlyFromFormat(
      line.substring(20, 28),
      DATE_FORMAT,
    );
    return record;
  }
}
export class ApplicationBulkWithdrawalFooter {
  recordType: RecordType;
  noOfRecords: number;
  public static createFromLine(line: string): ApplicationBulkWithdrawalFooter {
    const footer = new ApplicationBulkWithdrawalFooter();
    footer.recordType = line.substring(0, 1) as RecordType;
    footer.noOfRecords = parseInt(line.substring(1, 7));
    return footer;
  }
}
