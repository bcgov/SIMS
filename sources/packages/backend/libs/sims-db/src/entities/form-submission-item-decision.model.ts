import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  Note,
  User,
  FormSubmissionDecisionStatus,
  FormSubmissionItem,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * History of forms decisions taken by the Ministry. The decisions history is stored in a separate
 * table to preserve the history of decisions for each form submission item. Each time a decision is
 * made (or reverted) on a form submission item, a new record is inserted into this table with the
 * relevant decision details.
 */
@Entity({ name: TableNames.FormSubmissionItemDecisions })
export class FormSubmissionItemDecision extends RecordDataModel {
  /**
   * Primary key of the form submission item decision.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Form submission item that this decision belongs to.
   */
  @ManyToOne(() => FormSubmissionItem, { nullable: false })
  @JoinColumn({
    name: "form_submission_item_id",
    referencedColumnName: ColumnNames.ID,
  })
  formSubmissionItem: FormSubmissionItem;
  /**
   * Decision status.
   */
  @Column({
    name: "decision_status",
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
  })
  decisionDate: Date;
  /**
   * Ministry user who made the decision.
   */
  @ManyToOne(() => User)
  @JoinColumn({
    name: "decision_by",
    referencedColumnName: ColumnNames.ID,
  })
  decisionBy: User;
  /**
   * Note associated with the decision.
   */
  @OneToOne(() => Note, { cascade: ["insert", "update"] })
  @JoinColumn({
    name: "decision_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  decisionNote: Note;
}
