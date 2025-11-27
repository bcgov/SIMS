import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { BaseRestrictionModel } from "./base-restriction.model";
import { EducationProgram, Institution, InstitutionLocation } from ".";

/**
 * Entity for institution restrictions.
 */
@Entity({ name: TableNames.InstitutionRestrictions })
export class InstitutionRestriction extends BaseRestrictionModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Institutions that owns the restriction.
   */
  @ManyToOne(() => Institution)
  @JoinColumn({
    name: "institution_id",
    referencedColumnName: ColumnNames.ID,
  })
  institution: Institution;

  /**
   * Specific program the restriction applies to.
   */
  @ManyToOne(() => EducationProgram)
  @JoinColumn({
    name: "program_id",
    referencedColumnName: ColumnNames.ID,
  })
  program: EducationProgram;

  /**
   * Specific location the restriction applies to.
   */
  @ManyToOne(() => InstitutionLocation)
  @JoinColumn({
    name: "location_id",
    referencedColumnName: ColumnNames.ID,
  })
  location: InstitutionLocation;
}
