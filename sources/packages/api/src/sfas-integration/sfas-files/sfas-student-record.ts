import { SFASRecordIdentification } from "./sfas-record-identification";

/**
 * These records contain data related to an individual/student in SFAS.
 */
export class SFASStudentRecord extends SFASRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }
  /**
   * The first name as defined in SFAS.
   * individual_alias.first_name
   */
  get firstName(): string {
    return this.line.substr(13, 15);
  }
  /**
   * The last name as defined in SFAS
   * individual_alias.last_name.
   */
  get lastName(): string {
    return this.line.substr(28, 25);
  }
  /**
   * The middle name as defined in SFAS
   * individual_alias.middle_name.
   */
  get middleName(): string {
    return this.line.substr(53, 15);
  }
  /**
   * Date of birth
   * individual.date_of_birth
   */
  get birthDate(): string {
    return this.line.substr(68, 8);
  }
  /**
   * Social Insurance Number for the student
   * individual.sin
   */
  get sin(): string {
    return this.line.substr(76, 9);
  }
  /**
   * Permanent Disability Flag
   * individual.permanent_disability_flg
   */
  get permanentDisability(): boolean {
    return this.line.substr(85, 1) === "Y";
  }
  /**
   * The most recent, active Master Student Loan Agreement Number.
   * loan_agreement_request.msfaa_agreement_number
   */
  get msfaaNumber(): string {
    return this.line.substr(86, 10);
  }
  /**
   * The most recent, active Master Student Loan Agreement signed date
   * Loan_agreement_request.loan_agreement_signed_dte
   */
  get msfaaSignedDate(): string {
    return this.line.substr(96, 8);
  }
  /**
   * Total Nurses Education Bursary $
   * special_program_award.program_awd_cents
   * award_cde = “SP04”.
   */
  get neb(): string {
    return this.line.substr(104, 10);
  }
  /**
   * BC Completion Grant for Graduates $
   * Individual_award.award_dlr
   * award_cde = “BCGG”.
   */
  get bcgg(): string {
    return this.line.substr(114, 10);
  }
  /**
   * Nurses/Medical Loan Forgiveness.
   */
  get lfp(): string {
    return this.line.substr(124, 10);
  }
  /**
   * Pacific Leaders Loan Forgiveness.
   */
  get pal(): string {
    return this.line.substr(134, 10);
  }
  /**
   * BC Student Loan total overaward balance
   * overaward_balance.overaward_balance_amt
   * overaward_balance_cde = “CSL”.
   */
  get cslOveraward(): string {
    return this.line.substr(144, 10);
  }
  /**
   * Canada Student Loan total overaward balance
   * overaward_balance.overaward_balance_amt
   * overaward_balance_cde = “BCSL”.
   */
  get bcslOveraward(): string {
    return this.line.substr(154, 10);
  }
  /**
   * Canada Millennium Grant total overaward balance
   * overaward_balance.overaward_balance_amt
   * overaward_balance_cde = “GRNT”.
   */
  get cmsOveraward(): string {
    return this.line.substr(164, 10);
  }
  /**
   * BC Grant total overaward balance
   * overaward_balance.overaward_balance_amt
   * overaward_balance_cde = “EGRT”.
   */
  get grantOveraward(): string {
    return this.line.substr(174, 10);
  }
  /**
   * Total # of non-punitive withdrawals
   * (either in funded or non-funded periods)
   * BCSLWTHD count.
   */
  get withdrawals(): string {
    return this.line.substr(184, 10);
  }
  /**
   * Total of unsuccessful completion weeks
   * unsuccessful_completion.uc_weeks_qty
   */
  get unsuccessfulCompletion(): string {
    return this.line.substr(194, 10);
  }
}
