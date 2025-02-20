import { parseDate, parseDecimal, parseInteger } from "./sfas-parse-utils";
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
  /**
   * The unique application number assigned to this application (application_alias.application_no).
   */
  get applicationNumber(): number | null {
    return parseInteger(this.line.substring(145, 155));
  }
  /**
   * (Spouse/dependents/parents)|To verify information provided to SDPR
   * for the purpose of determining or auditing
   * eligibility (application.study_period_living_at_home_flg).
   */
  get livingArrangements(): string {
    return this.line.substring(155, 156);
  }
  /**
   * Status (single, common law, married, separated, divorced).
   * This is a code eg. MA for married (application_assessment.student_marital_status_cde).
   */
  get maritalStatus(): string {
    return this.line.substring(156, 160).trim();
  }
  /**
   * Applicant's marriage date (applicant_spouse.marriage_dte).
   */
  get marriageDate(): Date | null {
    return parseDate(this.line.substring(160, 168));
  }
  /**
   * Immigration status for student, BC residency (application.bc_residency_flag).
   */
  get bcResidencyFlag(): string {
    return this.line.substring(168, 169);
  }
  /**
   * Permanent residency status (application.permanent_resident_flg).
   */
  get permanentResidencyFlag(): string {
    return this.line.substring(169, 170);
  }
  /**
   * Amount declared by the applicant on the application for gross income from previous year
   * (applicant_income.income_amt  (applicant_income.applicant_owner_cde = 'A' and applicant_income_.income_type_cde = 'APYI')).
   */
  get grossIncomePreviousYear(): number | null {
    return parseDecimal(this.line.substring(170, 180));
  }
  /**
   * The unique institution code for the institution that the applicant is attending (institution.institution_cde).
   */
  get institutionCode(): string {
    return this.line.substring(180, 184);
  }
  /**
   * The latest application 'status code' (application_status.application_status_cde).
   */
  get applicationStatusCode(): string {
    return this.line.substring(184, 188);
  }
  /**
   * The number of study weeks used in the assessment of this application (application_assessment.NO_OF_EDUC_PERIOD_WEEKS).
   */
  get educationPeriodWeeks(): number | null {
    return parseInteger(this.line.substring(188, 190));
  }
  /**
   * Course load in percentage (application.course_load_cde).
   */
  get courseLoad(): number | null {
    return parseInteger(this.line.substring(190, 193));
  }
  /**
   * Living allowance (assessment_v2.SP_EXP_LIVING_ALLOWANCE + assessment_v2.SP_EXP_LIV_ALLOW_DEPENDENTS).
   */
  get assessedCostsLivingAllowance(): number | null {
    return parseInteger(this.line.substring(193, 203));
  }
  /**
   * Extra shelter (assessment_v2.SP_EXP_EXT_SHELTER_APPLICANT).
   */
  get assessedCostsExtraShelter(): number | null {
    return parseInteger(this.line.substring(203, 213));
  }
  /**
   * Child care expenses (assessment_v2.SP_EXP_SUPERVISING_CHILDREN).
   */
  get assessedCostsChildCare(): number | null {
    return parseInteger(this.line.substring(213, 223));
  }
  /**
   * Alimony.
   */
  get assessedCostsAlimony(): number | null {
    return parseInteger(this.line.substring(223, 233));
  }
  /**
   * Local transportation costs (assessment_v2.SP_EXP_EXT_LOCAL_TRANSPORT).
   */
  get assessedCostsLocalTransport(): number | null {
    return parseInteger(this.line.substring(233, 243));
  }
  /**
   * Return transportation costs (assessment_v2.SP_EXP_RETURN_TRANSPORT).
   */
  get assessedCostsReturnTransport(): number | null {
    return parseInteger(this.line.substring(243, 253));
  }
  /**
   * Tuition costs (assessment_v2.SP_EXP_EDUC_TUITION).
   */
  get assessedCostsTuition(): number | null {
    return parseInteger(this.line.substring(253, 263));
  }
  /**
   * Books and supplies costs (assessment_v2.SP_EXP_EDUC_BOOKS_SUPPLIES).
   */
  get assessedCostsBooksAndSupplies(): number | null {
    return parseInteger(this.line.substring(263, 273));
  }
  /**
   * Exceptional expenses (assessment_v2.SP_EXP_EDUC_INST_EXCEPTIONAL).
   */
  get assessedCostsExceptionalExpenses(): number | null {
    return parseInteger(this.line.substring(273, 283));
  }
  /**
   * Other expenses (assessment_v2.SP_EXP_EDUC_TRANSFER + assessment_v2.SP_EXP_EDUC_OTHER + assessment_v2.SP_EXP_STUDENT_LOAN_PMTS).
   */
  get assessedCostsOther(): number | null {
    return parseInteger(this.line.substring(283, 293));
  }
  /**
   * Eligible need.
   */
  get eligibleNeed(): number | null {
    return parseInteger(this.line.substring(293, 303));
  }
  /**
   * Date of withdrawal from school (bcslwthd.withdrawal_dte).
   */
  get withdrawalDate(): Date | null {
    return parseDate(this.line.substring(303, 311));
  }
  /**
   * Reason for withdrawal (bcslwthd.withdrawal_rsn_cde).
   */
  get withdrawalReason(): string {
    return this.line.substring(311, 315);
  }
  /**
   * Flag stating if the withdrawal is reversed/canceled.
   */
  get withdrawalActiveFlag(): string {
    return this.line.substring(315, 316);
  }
}
