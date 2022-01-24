import { Column, Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { BaseModel, SFASIndividual } from ".";
import { TableNames, ColumnNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";

/**
 * Data related to a Part Time Student Application on SFAS that came from SAIL
 */
@Entity({ name: TableNames.SFASPartTimeApplications })
export class SFASPartTimeApplications extends BaseModel {
  /**
   * The unique key/number used in SFAS to identify this application (Sail_extract_data.sail_application_no).
   */
  @PrimaryColumn()
  id: string;
  /**
   * The unique key/number used in SFAS to identify this individual (Sail_extract_data.individual_idx).
   */
  @Column({
    name: "individual_id",
    nullable: false,
  })
  individualId: number;

  /**
   * SFAS Individual many to one relationship.
   */
  @ManyToOne(() => SFASIndividual, { eager: false, cascade: false })
  @JoinColumn({
    name: "individual_id",
    referencedColumnName: ColumnNames.ID,
  })
  individual: SFASIndividual;

  /**
   * Educational program start date (Sail_extract_data.educ_start_dte).
   */
  @Column({
    name: "start_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  startDate?: Date;
  /**
   * Educational Program End date (Sail_extract_data.educ_end_dte).
   */
  @Column({
    name: "end_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  endDate?: Date;
  /**
   * CSGP Award Amount (sail_extract_data.sail_csgp_award_amt).
   */
  @Column({
    name: "csgp_award",
    nullable: true,
  })
  CSGPAward: number;
  /**
   * SBSD Award Amount (sail_extract_data.sail_bcsl_sbsd_award_amt ).
   */
  @Column({
    name: "sbsd_award",
    nullable: true,
  })
  SBSDAward: number;
  /**
   * Date that the record was extracted from SFAS.
   */
  @Column({
    name: "extracted_at",
    type: "timestamptz",
    nullable: false,
  })
  extractedAt: Date;
}
