import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseModel } from ".";
import { TableNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";

/**
 * This record contain data related to student’s Provincial Restrictions in SFAS.
 * No Federal restrictions will be reported, as it is assumed that SIMS will
 * process the Federal Restriction file on a regular basis.
 */
@Entity({ name: TableNames.SFASRestrictions })
export class SFASRestriction extends BaseModel {
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
   * Restriction code (individual_process_control.control_reason_cde).
   */
  @Column({
    name: "code",
    nullable: false,
  })
  code: string;
  /**
   * Date that this restriction is considered effective
   * (individual_process_control.control_effective_dte).
   */
  @Column({
    name: "effective_date",
    type: "date",
    nullable: false,
    transformer: dateOnlyTransformer,
  })
  effectiveDate: Date;
  /**
   * Date that this restriction is considered removed and no longer in effect
   * individual_process_control.control_removed_dte (date).
   */
  @Column({
    name: "removal_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  removalDate?: Date;
  /**
   * Date that the record was extracted from SFAS.
   */
  @Column({
    name: "extracted_at",
    nullable: false,
  })
  extractedAt: Date;
}
