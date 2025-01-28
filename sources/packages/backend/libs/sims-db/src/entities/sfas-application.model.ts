import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseSFASApplicationModel } from "./base-sfas-application.model";
import { TableNames } from "../constant";
import { numericTransformer } from "@sims/sims-db/transformers/numeric.transformer";

/**
 * Data related to a Student Application on SFAS.
 */
@Entity({ name: TableNames.SFASApplications })
export class SFASApplication extends BaseSFASApplicationModel {
  /**
   * The unique key/number used in SFAS to identify this application (application.application_idx).
   */
  @PrimaryColumn()
  id: number;
  /**
   * Educational program start date (application_assessment.educ_period_start_dte).
   */
  @Column({
    name: "start_date",
    type: "date",
    nullable: true,
  })
  startDate?: string;
  /**
   * Educational Program End date (application_assessment.educ_period_end_dte).
   */
  @Column({
    name: "end_date",
    type: "date",
    nullable: true,
  })
  endDate?: string;
  /**
   * Program year (application.program_yr_id).
   * Example: 20202021.
   */
  @Column({
    name: "program_year_id",
    nullable: true,
  })
  programYearId?: number;
  /**
   * Total BC Student Loan (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "bsl_award",
    nullable: true,
  })
  bslAward: number;
  /**
   * Total CSL Student Loan (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csl_award",
    nullable: true,
  })
  cslAward: number;
  /**
   * Total BC Access Grant award_disbursement.disbursement_amt.
   */
  @Column({
    name: "bcag_award",
    nullable: true,
  })
  bcagAward: number;
  /**
   * Total British Columbia Permanent Disability Grant (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "bgpd_award",
    nullable: true,
  })
  bgpdAward: number;
  /**
   * Total Canada Student Grant for Students in Full Time Studies (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csfg_award",
    nullable: true,
  })
  csfgAward: number;
  /**
   * Total Canada Student Top-Up Grant for Adult Learners (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csgt_award",
    nullable: true,
  })
  csgtAward: number;
  /**
   * Total Canada Grant – Full-Time with Dependent (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csgd_award",
    nullable: true,
  })
  csgdAward: number;
  /**
   * Total Canada Student Grant for Students with Permanent Disabilities (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csgp_award",
    nullable: true,
  })
  csgpAward: number;
  /**
   * Total Supplemental Bursary for Students with Disabilities (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "sbsd_award",
    nullable: true,
  })
  sbsdAward: number;
  /**
   * Date that this application was cancelled (application.cancel_dte).
   */
  @Column({
    name: "application_cancel_date",
    type: "date",
    nullable: true,
  })
  applicationCancelDate?: string;
  /**
   * Date that the record was extracted from SFAS.
   */
  @Column({
    name: "extracted_at",
    type: "timestamptz",
    nullable: false,
  })
  extractedAt: Date;

  /**
   * The unique application number assigned to this application (application_alias.application_no).
   */
  @Column({
    name: "application_number",
    nullable: true,
  })
  applicationNumber?: number;

  /**
   * (Spouse/dependents/parents)|To verify information provided to SDPR
   * for the purpose of determining or auditing
   * eligibility (application.study_period_living_at_home_flg).
   */
  @Column({
    name: "living_arrangements",
    nullable: true,
  })
  livingArrangements?: string;

  /**
   * Status (single, common law, married, separated, divorced).
   * This is a code eg. MA for married (application_assessment.student_marital_status_cde).
   */
  @Column({
    name: "marital_status",
    nullable: true,
  })
  maritalStatus?: string;
  /**
   * Applicant's marriage date (applicant_spouse.marriage_dte).
   */
  @Column({
    name: "marriage_date",
    type: "date",
    nullable: true,
  })
  marriageDate?: string;
  /**
   * Immigration status for student, BC residency (application.bc_residency_flag).
   */
  @Column({
    name: "bc_residency_flag",
    nullable: true,
  })
  bcResidencyFlag?: string;
  /**
   * Permanent residency status (application.permanent_resident_flg).
   */
  @Column({
    name: "permanent_residency_flag",
    nullable: true,
  })
  permanentResidencyFlag?: string;
  /**
   * Amount declared by the applicant on the application for gross income from previous year
   * (applicant_income.income_amt  (applicant_income.applicant_owner_cde = 'A' and applicant_income_.income_type_cde = 'APYI')).
   */
  @Column({
    name: "gross_income_previous_year",
    nullable: true,
  })
  grossIncomePreviousYear?: number;
  /**
   * The unique institution code for the institution that the applicant is attending (institution.institution_cde).
   */
  @Column({
    name: "institution_code",
    nullable: true,
  })
  institutionCode?: string;
  /**
   * The latest application 'status code' (application_status.application_status_cde).
   */
  @Column({
    name: "application_status_code",
    nullable: true,
  })
  applicationStatusCode?: string;
  /**
   * The number of study weeks used in the assessment of this application (application_assessment.NO_OF_EDUC_PERIOD_WEEKS).
   */
  @Column({
    name: "education_period_weeks",
    type: "smallint",
    nullable: true,
  })
  educationPeriodWeeks?: number;
  /**
   * Course load in percentage (application.course_load_cde).
   */
  @Column({
    name: "course_load",
    type: "smallint",
    nullable: true,
  })
  courseLoad?: number;
  /**
   * Living allowance (assessment_v2.SP_EXP_LIVING_ALLOWANCE + assessment_v2.SP_EXP_LIV_ALLOW_DEPENDENTS).
   */
  @Column({
    name: "assessed_costs_living_allowance",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsLivingAllowance?: number;
  /**
   * Extra shelter (assessment_v2.SP_EXP_EXT_SHELTER_APPLICANT).
   */
  @Column({
    name: "assessed_costs_extra_shelter",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsExtraShelter?: number;
  /**
   * Child care expenses (assessment_v2.SP_EXP_SUPERVISING_CHILDREN).
   */
  @Column({
    name: "assessed_costs_child_care",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsChildCare?: number;
  /**
   * Alimony (assessment_v2.SP_EXP_MAINTENANCE_ALIMONY).
   */
  @Column({
    name: "assessed_costs_alimony",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsAlimony?: number;
  /**
   * Local transportation costs (assessment_v2.SP_EXP_EXT_LOCAL_TRANSPORT).
   */
  @Column({
    name: "assessed_costs_local_transport",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsLocalTransport?: number;
  /**
   * Return transportation costs (assessment_v2.SP_EXP_RETURN_TRANSPORT).
   */
  @Column({
    name: "assessed_costs_return_transport",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsReturnTransport?: number;
  /**
   * Tuition costs (assessment_v2.SP_EXP_EDUC_TUITION).
   */
  @Column({
    name: "assessed_costs_tuition",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsTuition?: number;
  /**
   * Books and supplies costs (assessment_v2.SP_EXP_EDUC_BOOKS_SUPPLIES).
   */
  @Column({
    name: "assessed_costs_books_and_supplies",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsBooksAndSupplies?: number;
  /**
   * Exceptional expenses (assessment_v2.SP_EXP_EDUC_INST_EXCEPTIONAL).
   */
  @Column({
    name: "assessed_costs_exceptional_expenses",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsExceptionalExpenses?: number;
  /**
   * Other expenses (assessment_v2.SP_EXP_EDUC_TRANSFER + assessment_v2.SP_EXP_EDUC_OTHER + assessment_v2.SP_EXP_STUDENT_LOAN_PMTS).
   */
  @Column({
    name: "assessed_costs_other",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsOther?: number;
  /**
   * Discretionary expenses (assessment_v2.SP_EXP_OTHER).
   */
  @Column({
    name: "assessed_costs_discretionary_expenses",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  assessedCostsDiscretionaryExpenses?: number;
  /**
   * Date of withdrawal from school (bcslwthd.withdrawal_dte).
   */
  @Column({
    name: "withdrawal_date",
    type: "date",
    nullable: true,
  })
  withdrawalDate?: string;
  /**
   * Reason for withdrawal (bcslwthd.withdrawal_rsn_cde).
   */
  @Column({
    name: "withdrawal_reason",
    nullable: true,
  })
  withdrawalReason?: string;
  /**
   * Flag stating if the withdrawal is reversed/canceled.
   */
  @Column({
    name: "withdrawal_active_flag",
    nullable: true,
  })
  withdrawalActiveFlag?: string;
}
