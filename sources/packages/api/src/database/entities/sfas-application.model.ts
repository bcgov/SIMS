import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseModel } from ".";
import { TableNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";

/**
 * Data related to a Student Application on SFAS.
 */
@Entity({ name: TableNames.SFASApplications })
export class SFASApplication extends BaseModel {
  /**
   * The unique key/number used in SFAS to identify this application (application.application_idx).
   */
  @PrimaryColumn()
  id: number;
  /**
   * The unique key/number used in SFAS to identify this individual (individual.individual_idx).
   */
  @Column({
    name: "individual_id",
    nullable: false,
  })
  individualId: number;
  /**
   * Educational program start date (application_assessment.educ_period_start_dte).
   */
  @Column({
    name: "start_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  startDate?: Date;
  /**
   * Educational Program End date (application_assessment.educ_period_end_dte).
   */
  @Column({
    name: "end_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  endDate?: Date;
  /**
   * Program year (application.program_yr_id).
   * Example: 20202021.
   */
  @Column({
    name: "program_year_id",
    nullable: false,
  })
  programYearId: number;
  /**
   * Total BC Student Loan (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "bsl_award",
    nullable: false,
  })
  bslAward: number;
  /**
   * Total CSL Student Loan (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csl_award",
    nullable: false,
  })
  cslAward: number;
  /**
   * Total BC Access Grant award_disbursement.disbursement_amt.
   */
  @Column({
    name: "bcag_award",
    nullable: false,
  })
  bcagAward: number;
  /**
   * Total British Columbia Permanent Disability Grant (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "bgpd_award",
    nullable: false,
  })
  bgpdAward: number;
  /**
   * Total Canada Student Grant for Students in Full Time Studies (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csfg_award",
    nullable: false,
  })
  csfgAward: number;
  /**
   * Total Canada Student Top-Up Grant for Adult Learners (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csgt_award",
    nullable: false,
  })
  csgtAward: number;
  /**
   * Total Canada Grant – Full-Time with Dependent (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csgd_award",
    nullable: false,
  })
  csgdAward: number;
  /**
   * Total Canada Student Grant for Students with Permanent Disabilities (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "csgp_award",
    nullable: false,
  })
  csgpAward: number;
  /**
   * Total Supplemental Bursary for Students with Disabilities (award_disbursement.disbursement_amt).
   */
  @Column({
    name: "sbsd_award",
    nullable: false,
  })
  sbsdAward: number;
  /**
   * Date that this application was canceled (application.cancel_dte).
   */
  @Column({
    name: "application_cancel_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  applicationCancelDate?: Date;
  /**
   * Date that the record was extracted from SFAS.
   */
  @Column({
    name: "extracted_at",
    nullable: false,
  })
  extractedAt: Date;
}
