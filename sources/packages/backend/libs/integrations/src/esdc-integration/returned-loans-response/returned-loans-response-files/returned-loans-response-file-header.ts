import { ReturnedLoansResponseRecordType } from "@sims/integrations/esdc-integration/returned-loans-response/models/returned-loans-response.model";
import { ReturnedLoansResponseFileRecord } from "./returned-loans-response-file-record";

/**
 * Returned loans response file header.
 */
export class ReturnedLoansResponseFileHeader extends ReturnedLoansResponseFileRecord {
  constructor(line: string) {
    super(line);
  }
  /**
   * File creation date.
   */
  get fileCreationDate(): Date | null {
    return this.convertToDateRecord(this.line.substring(18, 26));
  }

  /**
   * File sequence number.
   */
  get fileSequenceNumber(): number {
    return +this.line.substring(26, 31);
  }

  /**
   * Validate the data.
   * @returns validation errors if any, otherwise an empty array.
   */
  validate(): string[] {
    const errors: string[] = [];
    if (this.recordType !== ReturnedLoansResponseRecordType.Header) {
      errors.push(`Invalid record type ${this.recordType}`);
    }
    if (!this.fileCreationDate) {
      errors.push("Invalid file creation date");
    }
    if (!this.fileSequenceNumber) {
      errors.push(`Invalid file sequence number ${this.fileSequenceNumber}`);
    }
    return errors;
  }
}
