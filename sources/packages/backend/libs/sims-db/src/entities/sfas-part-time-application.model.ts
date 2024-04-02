import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseSFASApplicationModel } from "./base-sfas-application.model";
import { TableNames } from "../constant";

/**
 * Data related to a Part Time Student Application on SFAS that came from SAIL
 */
@Entity({ name: TableNames.SFASPartTimeApplications })
export class SFASPartTimeApplications extends BaseSFASApplicationModel {
  /**
   * The unique key/number used in SFAS to identify this application (Sail_extract_data.sail_application_no).
   */
  @PrimaryColumn()
  id: string;

  /**
   * Educational program start date (Sail_extract_data.educ_start_dte).
   */
  @Column({
    name: "start_date",
    type: "date",
    nullable: true,
  })
  startDate?: string;
  /**
   * Educational Program End date (Sail_extract_data.educ_end_dte).
   */
  @Column({
    name: "end_date",
    type: "date",
    nullable: true,
  })
  endDate?: string;
  /**
   * CSGP Award Amount (sail_extract_data.sail_csgp_award_amt).
   */
  @Column({
    name: "csgp_award",
    nullable: true,
  })
  csgpAward?: number;
  /**
   * SBSD Award Amount (sail_extract_data.sail_bcsl_sbsd_award_amt ).
   */
  @Column({
    name: "sbsd_award",
    nullable: true,
  })
  sbsdAward?: number;
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
   * CSPT Award Amount (sail_extract_data.sail_cspt_amt).
   */
  @Column({
    name: "cspt_award",
    nullable: true,
  })
  csptAward?: number;
  /**
   * CSGD Award Amount (sail_extract_data.sail_ptdep_amt).
   */
  @Column({
    name: "csgd_award",
    nullable: true,
  })
  csgdAward?: number;
  /**
   * BCAG-PT Amount (sail_extract_data.sail_bcag_amt).
   */
  @Column({
    name: "bcag_award",
    nullable: true,
  })
  bcagAward?: number;
  /**
   * CSLP Amount (sail_extract_data.sail_cslp_amt).
   */
  @Column({
    name: "cslp_award",
    nullable: true,
  })
  cslpAward?: number;
  /**
   * Program Year ID associated with application.
   * Example: 20202021.
   */
  @Column({
    name: "program_year_id",
    nullable: true,
  })
  programYearId?: number;
}
