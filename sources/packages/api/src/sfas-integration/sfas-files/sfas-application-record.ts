import { parseDate, parseDecimal } from "./sfas-parse-utils";
import { SFASRecordIdentification } from "./sfas-record-identification";

/**
 * This record contain data related to an Student Application on SFAS.
 */
export class SFASApplicationRecord extends SFASRecordIdentification {
  constructor(line: string) {
    super(line);
  }
  /**
   * The unique key/number used in SFAS to identify this individual (individual.individual_idx).
   */
  get individualId(): number {
    return +this.line.substr(3, 10);
  }
  /**
   * The unique key/number used in SFAS to identify this application (application.application_idx).
   */
  get applicationId(): number {
    return +this.line.substr(13, 10);
  }
  /**
   * Educational program start date (application_assessment.educ_period_start_dte).
   */
  get startDate(): Date | null {
    return parseDate(this.line.substr(23, 8));
  }
  /**
   * Educational Program End date (application_assessment.educ_period_end_dte).
   */
  get endDate(): Date | null {
    return parseDate(this.line.substr(31, 8));
  }
  /**
   * Program year (Application.program_yr_id).
   * Example: 20202021.
   */
  get programYearId(): number | null {
    return +this.line.substr(39, 8) || null;
  }
  /**
   * Total BC Student Loan (award_disbursement.disbursement_amt).
   */
  get bslAward(): number {
    return parseDecimal(this.line.substr(47, 10));
  }
  /**
   * Total CSL Student Loan (award_disbursement.disbursement_amt).
   */
  get cslAward(): number {
    return parseDecimal(this.line.substr(57, 10));
  }
  /**
   * Total BC Access Grant award_disbursement.disbursement_amt.
   */
  get bcagAward(): number {
    return parseDecimal(this.line.substr(67, 10));
  }
  /**
   * Total British Columbia Permanent Disability Grant (award_disbursement.disbursement_amt).
   */
  get bgpdAward(): number {
    return parseDecimal(this.line.substr(77, 10));
  }
  /**
   * Total Canada Student Grant for Students in Full Time Studies (award_disbursement.disbursement_amt).
   */
  get csfgAward(): number {
    return parseDecimal(this.line.substr(87, 10));
  }
  /**
   * Total Canada Student Top-Up Grant for Adult Learners (award_disbursement.disbursement_amt).
   */
  get csgtAward(): number {
    return parseDecimal(this.line.substr(97, 10));
  }
  /**
   * Total Canada Grant – Full-Time with Dependent (award_disbursement.disbursement_amt).
   */
  get csgdAward(): number {
    return parseDecimal(this.line.substr(107, 10));
  }
  /**
   * Total Canada Student Grant for Students with Permanent Disabilities (award_disbursement.disbursement_amt).
   */
  get csgpAward(): number {
    return parseDecimal(this.line.substr(117, 10));
  }
  /**
   * Total Supplemental Bursary for Students with Disabilities (award_disbursement.disbursement_amt).
   */
  get sbsdAward(): number {
    return parseDecimal(this.line.substr(127, 10));
  }
  /**
   * Date that this application was cancelled (application.cancel_dte).
   */
  get applicationCancelDate(): Date | null {
    return parseDate(this.line.substr(137, 8));
  }
}
