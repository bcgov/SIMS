import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DynamicFormConfiguration, FormSubmission, Note, User } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { FormSubmissionDecisionStatus } from "@sims/sims-db/entities/form-submission-decision-status.type";

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
  @ManyToOne(() => FormSubmission)
  @JoinColumn({
    name: "form_submission_id",
    referencedColumnName: ColumnNames.ID,
  })
  formSubmission: FormSubmission;
  /**
   *Dynamic form configuration used to render and validate this item.
   */
  @ManyToOne(() => DynamicFormConfiguration)
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
   * Current decision status for this item.
   */
  @Column({
    name: "submission_status",
    type: "enum",
    enum: FormSubmissionDecisionStatus,
    enumName: "FormSubmissionDecisionStatus",
  })
  decisionStatus: FormSubmissionDecisionStatus;
  /**
   * Date and time when the decision was recorded.
   */
  @Column({
    name: "decision_date",
    type: "timestamptz",
    nullable: true,
  })
  decisionDate?: Date;
  /**
   * Ministry user who made the decision.
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: "decision_by",
    referencedColumnName: ColumnNames.ID,
  })
  decisionBy?: User;
  /**
   * Note associated with the decision.
   */
  @OneToOne(() => Note, { nullable: true })
  @JoinColumn({
    name: "decision_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  decisionNote?: Note;
}
