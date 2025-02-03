import { parseDate, parseInteger } from "./sfas-parse-utils";
import { SFASRecordIdentification } from "./sfas-record-identification";

/**
 * This record contain data related to student dependants (children) listed on each application in SFAS.
 */
export class SFASApplicationDependantRecord extends SFASRecordIdentification {
  constructor(line: string) {
    super(line);
  }
  /**
   * The unique key/number used in SFAS to identify this application (application.application_idx).
   */
  get applicationId(): number | null {
    return parseInteger(this.line.substring(3, 3 + 10));
  }
  /**
   * The unique key/number assigned to each dependant record (applicant_dependent.applicant_dependent_idx).
   */
  get dependantId(): number | null {
    return parseInteger(this.line.substring(13, 13 + 10));
  }
  /**
   * First and last name of the child (may include other names as well).
   */
  get dependantName(): string {
    return this.line.substring(23, 23 + 25)?.trim();
  }
  /**
   * Date of birth of the dependant (applicant_dependent.dep_date_of_birth).
   */
  get dependantBirthDate(): Date | null {
    return parseDate(this.line.substring(48, 48 + 8));
  }
}
