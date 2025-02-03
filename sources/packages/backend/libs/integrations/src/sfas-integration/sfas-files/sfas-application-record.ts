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
    return +this.line.substring(3, 3 + 10);
  }
  /**
   * The unique key/number used in SFAS to identify this application (application.application_idx).
   */
  get applicationId(): number {
    return +this.line.substring(13, 13 + 10);
  }
  /**
   * Educational program start date (application_assessment.educ_period_start_dte).
   */
  get startDate(): Date | null {
    return parseDate(this.line.substring(23, 23 + 8));
  }
  /**
   * Educational Program End date (application_assessment.educ_period_end_dte).
   */
  get endDate(): Date | null {
    return parseDate(this.line.substring(31, 31 + 8));
  }
  /**
   * Program year (Application.program_yr_id).
   * Example: 20202021.
   */
  get programYearId(): number | null {
    return +this.line.substring(39, 39 + 8) || null;
  }
  /**
   * Total BC Student Loan (award_disbursement.disbursement_amt).
   */
  get bslAward(): number | null {
    return this.line.substring(47, 47 + 10).trim()
      ? parseDecimal(this.line.substring(47, 47 + 10))
      : null;
  }
  /**
   * Total CSL Student Loan (award_disbursement.disbursement_amt).
   */
  get cslAward(): number | null {
    return this.line.substring(57, 57 + 10).trim()
      ? parseDecimal(this.line.substring(57, 57 + 10))
      : null;
  }
  /**
   * Total BC Access Grant award_disbursement.disbursement_amt.
   */
  get bcagAward(): number | null {
    return this.line.substring(67, 67 + 10).trim()
      ? parseDecimal(this.line.substring(67, 67 + 10))
      : null;
  }
  /**
   * Total British Columbia Permanent Disability Grant (award_disbursement.disbursement_amt).
   */
  get bgpdAward(): number | null {
    return this.line.substring(77, 77 + 10).trim()
      ? parseDecimal(this.line.substring(77, 77 + 10))
      : null;
  }
  /**
   * Total Canada Student Grant for Students in Full Time Studies (award_disbursement.disbursement_amt).
   */
  get csfgAward(): number | null {
    return this.line.substring(87, 87 + 10).trim()
      ? parseDecimal(this.line.substring(87, 87 + 10))
      : null;
  }
  /**
   * Total Canada Student Top-Up Grant for Adult Learners (award_disbursement.disbursement_amt).
   */
  get csgtAward(): number | null {
    return this.line.substring(97, 97 + 10).trim()
      ? parseDecimal(this.line.substring(97, 97 + 10))
      : null;
  }
  /**
   * Total Canada Grant – Full-Time with Dependent (award_disbursement.disbursement_amt).
   */
  get csgdAward(): number | null {
    return this.line.substring(107, 107 + 10).trim()
      ? parseDecimal(this.line.substring(107, 107 + 10))
      : null;
  }
  /**
   * Total Canada Student Grant for Students with Permanent Disabilities (award_disbursement.disbursement_amt).
   */
  get csgpAward(): number | null {
    return this.line.substring(117, 117 + 10).trim()
      ? parseDecimal(this.line.substring(117, 117 + 10))
      : null;
  }
  /**
   * Total Supplemental Bursary for Students with Disabilities (award_disbursement.disbursement_amt).
   */
  get sbsdAward(): number | null {
    return this.line.substring(127, 127 + 10).trim()
      ? parseDecimal(this.line.substring(127, 127 + 10))
      : null;
  }
  /**
   * Date that this application was cancelled (application.cancel_dte).
   */
  get applicationCancelDate(): Date | null {
    return parseDate(this.line.substring(137, 137 + 8));
  }

  get applicationNumber(): number {
    return +this.line.substring(145, 155);
  }

  get livingArrangements(): string {
    return this.line.substring(155, 156);
  }
}
