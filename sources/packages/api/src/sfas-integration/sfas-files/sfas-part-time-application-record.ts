import { parseDate } from "./sfas-parse-utils";
import { SFASRecordIdentification } from "./sfas-record-identification";

/**
 * This record contain data related to an Student part time Application on SFAS.
 */
export class SFASPartTimeApplicationRecord extends SFASRecordIdentification {
  constructor(line: string) {
    super(line);
  }
  /**
   * The unique key/number used in SFAS to identify this individual (Sail_extract_data.individual_idx).
   */
  get individualId(): number {
    return +this.line.substring(3, 3 + 10);
  }
  /**
   * The unique key/number used in SFAS to identify this application (Sail_extract_data.sail_application_no).
   */
  get applicationId(): string {
    return this.line.substring(13, 13 + 10);
  }
  /**
   * Educational program start date (Sail_extract_data.educ_start_dte).
   */
  get startDate(): Date | null {
    return parseDate(this.line.substring(23, 23 + 8));
  }
  /**
   * Educational Program End date (Sail_extract_data.educ_end_dte).
   */
  get endDate(): Date | null {
    return parseDate(this.line.substring(31, 31 + 8));
  }
  /**
   * CSGP Award Amount (sail_extract_data.sail_csgp_award_amt).
   */
  get CSGPAward(): number | null {
    return this.line.substring(39, 39 + 10).trim()
      ? +this.line.substring(39, 39 + 10).trim()
      : null;
  }
  /**
   * SBSD Award Amount (sail_extract_data.sail_bcsl_sbsd_award_amt ).
   */
  get SBSDAward(): number | null {
    return this.line.substring(49, 49 + 10).trim()
      ? +this.line.substring(49, 49 + 10).trim()
      : null;
  }
}
