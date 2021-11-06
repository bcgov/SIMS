import { parseDate } from "./sfas-parse-utils";
import { SFASRecordIdentification } from "./sfas-record-identification";

/**
 * This record contain data related to student’s Provincial Restrictions in SFAS.
 * No Federal restrictions will be reported, as it is assumed that SIMS will
 * process the Federal Restriction file on a regular basis.
 */
export class SFASRestrictionRecord extends SFASRecordIdentification {
  constructor(line: string) {
    super(line);
  }
  /**
   * The unique key/number used in SFAS to identify this individual
   * (individual.individual_idx).
   */
  get individualId(): number {
    return +this.line.substr(3, 10);
  }
  /**
   * The unique key/number used in SFAS to identify this restriction
   * (individual_process_control.individual_process_control_idx).
   */
  get restrictionId(): number {
    return +this.line.substr(13, 10);
  }
  /**
   * Restriction code (individual_process_control.control_reason_cde).
   */
  get code(): string {
    return this.line.substr(23, 4).trim();
  }
  /**
   * Date that this restriction is considered effective
   * (individual_process_control.control_effective_dte).
   */
  get effectiveDate(): Date {
    return parseDate(this.line.substr(27, 8));
  }
  /**
   * Date that this restriction is considered removed and no longer in effect
   * individual_process_control.control_removed_dte (date).
   */
  get removalDate(): Date | undefined {
    return parseDate(this.line.substr(35, 8));
  }
}
