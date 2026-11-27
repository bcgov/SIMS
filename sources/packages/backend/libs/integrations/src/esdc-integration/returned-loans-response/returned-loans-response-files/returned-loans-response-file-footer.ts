import { ReturnedLoansResponseRecordType } from "@sims/integrations/esdc-integration/returned-loans-response/models/returned-loans-response.model";
import { ReturnedLoansResponseFileRecord } from "./returned-loans-response-file-record";

/**
 * Returned loans response file footer.
 */
export class ReturnedLoansResponseFileFooter extends ReturnedLoansResponseFileRecord {
  constructor(line: string) {
    super(line);
  }

  /**
   * Count of number of detail records.
   */
  get totalDetailRecords(): number {
    return Number.parseInt(this.line.substring(2, 8));
  }

  /**
   * Validate the footer record against the expected context.
   * @param context Context containing the expected total detail records.
   * @returns validation errors if any, otherwise an empty array.
   */
  validate(context: { actualTotalDetailRecords: number }): string[] {
    const errors: string[] = [];
    if (this.recordType !== ReturnedLoansResponseRecordType.Footer) {
      errors.push(`Invalid record type ${this.recordType}`);
    }
    if (this.totalDetailRecords !== context.actualTotalDetailRecords) {
      errors.push(
        `Total details records provided ${this.totalDetailRecords} do not match the actual total ${context.actualTotalDetailRecords}`,
      );
    }
    return errors;
  }
}
