import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  BaseModel,
  DynamicFormType,
  FormCategory,
  OfferingIntensity,
  ProgramYear,
} from ".";
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

  /**
   * Indicates the category of the form.
   */
  @Column({
    name: "form_category",
    type: "enum",
    enum: FormCategory,
    enumName: "FormCategory",
  })
  formCategory: FormCategory;

  /**
   * Provides a description of the form to be shown to the user submitting it.
   */
  @Column({
    name: "form_description",
  })
  formDescription: string;

  /**
   * Indicates whether the form must be associated with a Student Application.
   */
  @Column({
    name: "has_application_scope",
  })
  hasApplicationScope: boolean;

  /**
   * Indicates whether this form can be part of submission that would included multiple forms.
   */
  @Column({
    name: "allow_bundled_submission",
  })
  allowBundledSubmission: boolean;
}
