import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  Application,
  FormCategoryType,
  FormSubmissionGroupingType,
  Student,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { FormSubmissionStatus } from "@sims/sims-db/entities/form-submission-status.type";

/**
 *
 */
@Entity({ name: TableNames.FormSubmissions })
export class FormSubmission extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student related to this form submission.
   * A form submission may or may not be linked to an application, but it must be linked to a student.
   */
  @ManyToOne(() => Student)
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * Application related to this form submission
   * when the submission is regarding an application.
   */
  @ManyToOne(() => Application, {
    cascade: ["update"],
    nullable: true,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application?: Application;
  /**
   * Date that the student submitted the form.
   */
  @Column({
    name: "submitted_date",
    type: "timestamptz",
    nullable: false,
  })
  submittedDate: Date;
  /**
   *
   */
  @Column({
    name: "form_category",
    type: "enum",
    enum: FormCategoryType,
    enumName: "FormCategoryType",
  })
  formCategory: FormCategoryType;
  /**
   *
   */
  @Column({
    name: "submission_grouping_type",
    type: "enum",
    enum: FormSubmissionGroupingType,
    enumName: "FormSubmissionGroupingType",
  })
  submissionGrouping: FormSubmissionGroupingType;
  /**
   *
   */
  @Column({
    name: "submission_status",
    type: "enum",
    enum: FormSubmissionStatus,
    enumName: "FormSubmissionStatus",
  })
  submissionStatus: FormSubmissionStatus;

  /**
   * Individual appeals that belongs to the same request.
   */
  // @OneToMany(
  //   () => StudentAppealRequest,
  //   (studentAppealRequest) => studentAppealRequest.studentAppeal,
  //   {
  //     eager: false,
  //     cascade: true,
  //     nullable: false,
  //   },
  // )
  // appealRequests: StudentAppealRequest[];
}
