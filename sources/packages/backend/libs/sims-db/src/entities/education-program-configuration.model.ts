import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { BaseModel } from "./base.model";
import { ProgramYear } from "./program-year.model";

/**
 * Dynamic form configuration used to create and validate an education program
 * for a particular program year.
 */
@Entity({ name: TableNames.EducationProgramsConfigurations })
export class EducationProgramConfiguration extends BaseModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Visual schema used to render the dynamic education program form.
   */
  @Column({
    name: "visual_schema",
    type: "jsonb",
    nullable: false,
  })
  visualSchema: unknown;

  /**
   * Validation schema used to validate the dynamic education program form.
   */
  @Column({
    name: "validation_schema",
    type: "jsonb",
    nullable: false,
  })
  validationSchema: unknown;

  /**
   * Program year associated with this configuration.
   */
  @ManyToOne(() => ProgramYear, { eager: false, nullable: false })
  @JoinColumn({
    name: "program_year_id",
    referencedColumnName: ColumnNames.ID,
  })
  programYear: ProgramYear;

  /**
   * Indicates if the configuration is the active one for the program year.
   */
  @Column({
    name: "is_active",
    nullable: false,
  })
  isActive: boolean;
}
