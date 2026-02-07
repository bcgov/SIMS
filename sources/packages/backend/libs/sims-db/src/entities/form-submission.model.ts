import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  Application,
  FormCategory,
  FormSubmissionItem,
  FormSubmissionStatus,
  Student,
  User,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * Form submissions for Ministry evaluation and decision. Each submission can
 * contain one or more forms where each form is assessed individually.
 */
@Entity({ name: TableNames.FormSubmissions })
export class FormSubmission extends RecordDataModel {
  /**
   * Primary key identifier.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student related to this form submission.
   */
  @ManyToOne(() => Student)
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * Application associated with the submission when the
   * form is student application-related.
   */
  @ManyToOne(() => Application, {
    nullable: true,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application?: Application;
  /**
   * Date and time when the submission was received.
   */
  @Column({
    name: "submitted_date",
    type: "timestamptz",
  })
  submittedDate: Date;
  /**
   * Category of the form. All forms for the submission must share the same category.
   * This column is denormalized from the form items for easier querying.
   */
  @Column({
    name: "form_category",
    type: "enum",
    enum: FormCategory,
    enumName: "FormCategory",
  })
  formCategory: FormCategory;
  /**
   * Current status of the submission. A submission will be considered completed when all
   * individual form items have been assessed and are no longer in pending state.
   */
  @Column({
    name: "submission_status",
    type: "enum",
    enum: FormSubmissionStatus,
    enumName: "FormSubmissionStatus",
  })
  submissionStatus: FormSubmissionStatus;
  /**
   * Date and time when the submission was assessed. When assessed, the status must be
   * either Completed or Declined.
   */
  @Column({
    name: "assessed_date",
    type: "timestamptz",
    nullable: true,
  })
  assessedDate?: Date;
  /**
   * User who assessed the submission.
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: "assessed_by",
    referencedColumnName: ColumnNames.ID,
  })
  assessedBy?: User;
  /**
   * Submission items containing the individual forms submitted for a decision.
   */
  @OneToMany(
    () => FormSubmissionItem,
    (formSubmissionItem) => formSubmissionItem.formSubmission,
    {
      cascade: ["insert"],
    },
  )
  formSubmissionItems: FormSubmissionItem[];
}
