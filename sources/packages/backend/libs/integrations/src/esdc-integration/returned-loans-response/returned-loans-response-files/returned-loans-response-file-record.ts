import {
  DATE_FORMAT,
  ReturnedLoansResponseRecordType,
} from "@sims/integrations/esdc-integration/returned-loans-response/models/returned-loans-response.model";
import { getDateOnlyFromFormat } from "@sims/utilities";

/**
 * Base class for returned loans response file record.
 */
export abstract class ReturnedLoansResponseFileRecord {
  constructor(protected readonly line: string) {}

  /**
   * Record type of the record in the file.
   */
  get recordType(): ReturnedLoansResponseRecordType {
    return this.line.substring(0, 2) as ReturnedLoansResponseRecordType;
  }

  /**
   * Converts a date string from the response file to a Date object.
   * @param dateText Date string in the format specified by DATE_FORMAT.
   * @returns Date object representing the date.
   */
  protected convertToDateRecord(dateText: string): Date {
    return getDateOnlyFromFormat(dateText, DATE_FORMAT);
  }
}
