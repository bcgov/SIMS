import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  DynamicFormConfiguration,
  FormSubmission,
  FormSubmissionItemDecision,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * Individual forms submitted for a decision that are part of a form submission process.
 * A submission can contain one or more form submission items, each representing a
 * specific form filled out by the user.
 */
@Entity({ name: TableNames.FormSubmissionItems })
export class FormSubmissionItem extends RecordDataModel {
  /**
   * Primary key of the form submission item.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Parent form submission that this item belongs to.
   */
  @ManyToOne(() => FormSubmission, { nullable: false })
  @JoinColumn({
    name: "form_submission_id",
    referencedColumnName: ColumnNames.ID,
  })
  formSubmission: FormSubmission;
  /**
   * Dynamic form configuration used to render and validate this item.
   */
  @ManyToOne(() => DynamicFormConfiguration, { nullable: false })
  @JoinColumn({
    name: "dynamic_form_configuration_id",
    referencedColumnName: ColumnNames.ID,
  })
  dynamicFormConfiguration: DynamicFormConfiguration;
  /**
   * Submitted form data payload in JSON format.
   */
  @Column({
    name: "submitted_data",
    type: "jsonb",
  })
  submittedData: unknown;
  /**
   * Current decision associated with the form submission item.
   */
  @OneToOne(() => FormSubmissionItemDecision, {
    nullable: true,
    cascade: ["insert", "update"],
  })
  @JoinColumn({
    name: "current_decision_id",
    referencedColumnName: ColumnNames.ID,
  })
  currentDecision?: FormSubmissionItemDecision;
  /**
   * History of decisions made on this form submission item. Each time a decision
   * is made (or reverted), a new record is inserted into the FormSubmissionItemDecisions
   * table with the relevant decision details, allowing to keep track of the history
   * of decisions for this item.
   */
  @OneToMany(
    () => FormSubmissionItemDecision,
    (formSubmissionItemDecision) =>
      formSubmissionItemDecision.formSubmissionItem,
  )
  decisions: FormSubmissionItemDecision[];
}
