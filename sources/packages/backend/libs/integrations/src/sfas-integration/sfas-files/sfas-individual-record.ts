import { parseDate, parseDecimal } from "./sfas-parse-utils";
import { SFASRecordIdentification } from "./sfas-record-identification";

/**
 * This record contain data related to an individual/student on SFAS.
 */
export class SFASIndividualRecord extends SFASRecordIdentification {
  constructor(line: string) {
    super(line);
  }
  /**
   * SFAS Unique id.
   */
  get id(): number {
    return +this.line.substring(3, 13);
  }
  /**
   * The first name as defined in SFAS(individual_alias.first_name).
   * First name could be not present for mononymous names.
   */
  get firstName(): string | null {
    return this.line.substring(13, 28).trim() || null;
  }
  /**
   * The last name as defined in SFAS (individual_alias.last_name).
   */
  get lastName(): string {
    return this.line.substring(28, 53).trim();
  }
  /**
   * The middle name as defined in SFAS (individual_alias.middle_name).
   * Middle name could be not present for mononymous names.
   */
  get middleName(): string | null {
    return this.line.substring(53, 68).trim() || null;
  }
  /**
   * Given names created from the first name and middle name
   * when both are available.
   */
  get givenNames(): string | null {
    if (this.firstName && this.middleName) {
      return `${this.firstName} ${this.middleName}`;
    }

    if (this.firstName) {
      return this.firstName;
    }

    if (this.middleName) {
      return this.middleName;
    }

    return null;
  }
  /**
   * Date of birth (individual.date_of_birth).
   */
  get birthDate(): Date {
    return parseDate(this.line.substring(68, 76));
  }
  /**
   * Social Insurance Number for the student (individual.sin).
   */
  get sin(): string {
    return this.line.substring(76, 85);
  }
  /**
   * Permanent Disability Flag (individual.permanent_disability_flg).
   */
  get pdStatus(): boolean | null {
    switch (this.line.substring(85, 86)) {
      case "Y":
        return true;
      case "N":
        return false;
      default:
        return null;
    }
  }
  /**
   * Persistent or Prolonged Disability Flag (individual.ppd_flg) .
   */
  get ppdStatus(): boolean | null {
    switch (this.line.substring(86, 87)) {
      case "Y":
        return true;
      case "N":
        return false;
      default:
        return null;
    }
  }
  /**
   * The date when a PPD status is effective (individual.ppd_status_dte).
   */
  get ppdStatusDate(): Date {
    return parseDate(this.line.substring(87, 95));
  }
  /**
   * The most recent, active Master Student Loan Agreement Number (loan_agreement_request.msfaa_agreement_number).
   */
  get msfaaNumber(): number | null {
    return +this.line.substring(95, 105) || null;
  }
  /**
   * The most recent, active Master Student Loan Agreement signed date (loan_agreement_request.loan_agreement_signed_dte).
   */
  get msfaaSignedDate(): Date | null {
    return parseDate(this.line.substring(105, 113));
  }
  /**
   * Total Nurses Education Bursary (special_program_award.program_awd_cents, award_cde = "SP04").
   */
  get neb(): number {
    return +this.line.substring(113, 123);
  }
  /**
   * BC Completion Grant for Graduates (individual_award.award_dlr, award_cde = "BCGG").
   */
  get bcgg(): number {
    return +this.line.substring(123, 133);
  }
  /**
   * Nurses/Medical Loan Forgiveness.
   */
  get lfp(): number {
    return parseDecimal(this.line.substring(133, 143));
  }
  /**
   * Pacific Leaders Loan Forgiveness.
   */
  get pal(): number {
    return parseDecimal(this.line.substring(143, 153));
  }
  /**
   * BC Student Loan total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "CSL").
   */
  get cslOveraward(): number {
    return parseDecimal(this.line.substring(153, 163));
  }
  /**
   * Canada Student Loan total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "BCSL").
   */
  get bcslOveraward(): number {
    return parseDecimal(this.line.substring(163, 173));
  }
  /**
   * Canada Millennium Grant total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "GRNT").
   */
  get cmsOveraward(): number {
    return parseDecimal(this.line.substring(173, 183));
  }
  /**
   * BC Grant total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "EGRT").
   */
  get grantOveraward(): number {
    return parseDecimal(this.line.substring(183, 193));
  }
  /**
   * Total number of non-punitive withdrawals (either in funded or non-funded periods). BCSLWTHD count.
   */
  get withdrawals(): number {
    return +this.line.substring(193, 203);
  }
  /**
   * Total of unsuccessful completion weeks (unsuccessful_completion.uc_weeks_qty).
   */
  get unsuccessfulCompletion(): number {
    return +this.line.substring(203, 213);
  }
}
