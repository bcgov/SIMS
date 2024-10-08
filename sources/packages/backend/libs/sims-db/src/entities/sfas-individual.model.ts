import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseModel } from ".";
import { TableNames } from "../constant";
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
}
