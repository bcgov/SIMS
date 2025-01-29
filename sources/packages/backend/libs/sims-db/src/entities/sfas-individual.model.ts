import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseModel, Student } from ".";
import { ColumnNames, TableNames } from "../constant";
import { numericTransformer } from "@sims/sims-db/transformers/numeric.transformer";

/**
 * Data related to an individual/student in SFAS.
 */
@Entity({ name: TableNames.SFASIndividuals })
export class SFASIndividual extends BaseModel {
  /**
   * SFAS Unique id.
   */
  @PrimaryColumn()
  id: number;
  /**
   * The first name as defined in SFAS(individual_alias.first_name).
   */
  @Column({
    name: "first_name",
    nullable: false,
  })
  firstName: string;
  /**
   * The last name as defined in SFAS (individual_alias.last_name).
   */
  @Column({
    name: "last_name",
    nullable: false,
  })
  lastName: string;
  /**
   * Date of birth (individual.date_of_birth).
   */
  @Column({
    name: "birth_date",
    type: "date",
    nullable: false,
  })
  birthDate: string;
  /**
   * Social Insurance Number for the student (individual.sin).
   */
  @Column({
    name: "sin",
    nullable: false,
  })
  sin: string;
  /**
   * Permanent Disability Flag (individual.permanent_disability_flg).
   */
  @Column({
    name: "pd_status",
    nullable: true,
  })
  pdStatus?: boolean;
  /**
   * Persistent or Prolonged Disability Flag (individual.ppd_flg).
   */
  @Column({
    name: "ppd_status",
    nullable: true,
  })
  ppdStatus?: boolean;
  /**
   * The date when a PPD status is effective (individual.ppd_status_dte).
   */
  @Column({
    name: "ppd_status_date",
    type: "date",
    nullable: true,
  })
  ppdStatusDate?: string;
  /**
   * The most recent, active Master Student Loan Agreement Number (loan_agreement_request.msfaa_agreement_number).
   */
  @Column({
    name: "msfaa_number",
    nullable: true,
  })
  msfaaNumber?: string;
  /**
   * The most recent, active Master Student Loan Agreement signed date (loan_agreement_request.loan_agreement_signed_dte).
   */
  @Column({
    name: "msfaa_signed_date",
    nullable: true,
    type: "date",
  })
  msfaaSignedDate?: string;
  /**
   * Total Nurses Education Bursary (special_program_award.program_awd_cents, award_cde = "SP04").
   */
  @Column({
    name: "neb",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  neb: number;
  /**
   * BC Completion Grant for Graduates (individual_award.award_dlr, award_cde = "BCGG").
   */
  @Column({
    name: "bcgg",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  bcgg: number;
  /**
   * Nurses/Medical Loan Forgiveness.
   */
  @Column({
    name: "lfp",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  lfp: number;
  /**
   * Pacific Leaders Loan Forgiveness.
   */
  @Column({
    name: "pal",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  pal: number;
  /**
   * BC Student Loan total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "CSL").
   */
  @Column({
    name: "csl_overaward",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  cslOveraward: number;
  /**
   * Canada Student Loan total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "BCSL").
   */
  @Column({
    name: "bcsl_overaward",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  bcslOveraward: number;
  /**
   * Canada Millennium Grant total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "GRNT").
   */
  @Column({
    name: "cms_overaward",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  cmsOveraward: number;
  /**
   * BC Grant total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "EGRT").
   */
  @Column({
    name: "grant_overaward",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  grantOveraward: number;
  /**
   * Total number of non-punitive withdrawals (either in funded or non-funded periods). BCSLWTHD count.
   */
  @Column({
    name: "withdrawals",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  withdrawals: number;
  /**
   * Total of unsuccessful completion weeks (unsuccessful_completion.uc_weeks_qty).
   */
  @Column({
    name: "unsuccessful_completion",
    nullable: false,
  })
  unsuccessfulCompletion: number;
  /**
   * Date that the record was extracted from SFAS.
   */
  @Column({
    name: "extracted_at",
    nullable: false,
  })
  extractedAt: Date;
  /**
   * The most recent Part-time Master Student Loan Agreement Number (agreement_num.sail_msfaa_numbers).
   */
  @Column({
    name: "part_time_msfaa_number",
    nullable: true,
  })
  partTimeMSFAANumber?: string;
  /**
   * The most recent Part-time Master Student Loan Agreement effective date (effective_date.sail_msfaa_numbers).
   */
  @Column({
    name: "part_time_msfaa_effective_date",
    type: "date",
    nullable: true,
  })
  partTimeMSFAAEffectiveDate?: string;
  /**
   * Student associated with this SFAS Individual.
   */
  @ManyToOne(() => Student, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student?: Student;
  /**
   * Initials of applicant (individual_alias_current_view.initials).
   */
  @Column({
    name: "initials",
    nullable: true,
  })
  initials?: string;
  /**
   * Line 1 of the applicant's address (address_current_view_unique.address_1).
   */
  @Column({
    name: "address_line_1",
    nullable: true,
  })
  addressLine1?: string;
  /**
   * Line 2 of the applicant's address.
   */
  @Column({
    name: "address_line_2",
    nullable: true,
  })
  addressLine2?: string;
  /**
   * City name the applicant's address (address_current_view_unique.city).
   */
  @Column({
    name: "city",
    nullable: true,
  })
  city?: string;
  /**
   * Province or state code - only exists if in Canada or US (address_current_view_unique.prov_cde).
   */
  @Column({
    name: "province_state",
    nullable: true,
  })
  provinceState?: string;
  /**
   * Country code (address_current_view_unique.country_cde).
   */
  @Column({
    name: "country",
    nullable: true,
  })
  country?: string;
  /**
   * Phone number of the applicant (address_current_view_unique.phone_num).
   */
  @Column({
    name: "phone_number",
    nullable: true,
  })
  phoneNumber?: number;
  /**
   * Applicant's postal (in Canada) or zip code (USA), otherwise blank (address_current_view_unique.postal_or_zip_code).
   */
  @Column({
    name: "postal_zip_code",
    nullable: true,
  })
  postalZipCode?: string;
  /**
   * Total labour market tools grant (individual_award.award_dlr where award_code = 'LMPT').
   */
  @Column({
    name: "lmpt_award_amount",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  lmptAwardAmount?: number;
  /**
   * Total labour market unmet need grant (individual_award.award_dlr where award_code = 'LMPU').
   */
  @Column({
    name: "lmpu_award_amount",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  lmpuAwardAmount?: number;
}
