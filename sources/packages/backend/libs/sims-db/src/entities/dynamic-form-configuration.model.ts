import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BaseModel, DynamicFormType, OfferingIntensity, ProgramYear } from ".";
import { ColumnNames, TableNames } from "../constant";

/**
 * Dynamic form configurations based on form type.
 */
@Entity({ name: TableNames.DynamicFormConfigurations })
export class DynamicFormConfiguration extends BaseModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Form type which is dynamically configured.
   * The column is a varchar in the database to allow for future expansion of form types
   * without database migrations.
   */
  @Column({
    name: "form_type",
    type: "varchar",
  })
  formType: DynamicFormType;

  /**
   * Program year to identify the dynamic form for the form type.
   */
  @ManyToOne(() => ProgramYear, { nullable: true })
  @JoinColumn({
    name: "program_year_id",
    referencedColumnName: ColumnNames.ID,
  })
  programYear?: ProgramYear;

  /**
   * Offering intensity to identify the dynamic form for the form type.
   */
  @Column({
    name: "offering_intensity",
    type: "enum",
    enum: OfferingIntensity,
    enumName: "OfferingIntensity",
    nullable: true,
  })
  offeringIntensity?: OfferingIntensity;

  /**
   * Form definition name for the form type based on configurations.
   */
  @Column({
    name: "form_definition_name",
  })
  formDefinitionName: string;
}
