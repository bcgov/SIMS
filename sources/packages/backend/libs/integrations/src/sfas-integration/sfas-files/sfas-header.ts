import { parseDateTime } from "./sfas-parse-utils";
import { SFASRecordIdentification } from "./sfas-record-identification";

/**
 * SFAS import file header.
 */
export class SFASHeader extends SFASRecordIdentification {
  constructor(line: string) {
    super(line);
  }
  /**
   * Date and time that the data was extracted.
   */
  get creationDate(): Date | null {
    return parseDateTime(this.line.substr(46, 14));
  }
}
