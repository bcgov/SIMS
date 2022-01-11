import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { BaseRestrictionModel } from "./base-restriction.model";
import { Institution } from ".";

/**
 * Entity for institution restrictions
 */
@Entity({ name: TableNames.InstitutionRestrictions })
export class InstitutionRestriction extends BaseRestrictionModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * institution to whom the restriction is assigned
   */
  @ManyToOne(() => Institution, { eager: false, cascade: false })
  @JoinColumn({
    name: "institution_id",
    referencedColumnName: ColumnNames.ID,
  })
  institution: Institution;
}
