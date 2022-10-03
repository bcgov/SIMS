import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Note, StudentAppeal, StudentAppealStatus, User } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * Represents as individual appeal requested by a student, for instance,
 * to have his income or dependents data changed on his Student Application
 * after it was completed.
 */
@Entity({ name: TableNames.StudentAppealRequests })
export class StudentAppealRequest extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student appeal id that groups the individual requests when the Student
   * needs an appeal, one or more can be requested at the same time.
   */
  @RelationId(
    (studentAppealRequest: StudentAppealRequest) =>
      studentAppealRequest.studentAppeal,
  )
  studentAppealId: number;
  /**
   * Student appeal that groups the individual requests when the Student
   * needs an appeal. One or more can be requested at the same time.
   */
  @ManyToOne(() => StudentAppeal, {
    eager: false,
    cascade: false,
    nullable: false,
  })
  @JoinColumn({
    name: "student_appeal_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentAppeal: StudentAppeal;
  /**
   * Dynamic form data that represents the appeal.
   */
  @Column({
    name: "submitted_data",
    type: "jsonb",
    nullable: false,
  })
  submittedData: any;
  /**
   * Dynamic form name used to request the appeal.
   */
  @Column({
    name: "submitted_form_name",
    nullable: false,
  })
  submittedFormName: string;
  /**
   * Status of the current request [Pending, Approved, Denied].
   */
  @Column({
    name: "appeal_status",
    type: "enum",
    enum: StudentAppealStatus,
    enumName: "StudentAppealStatus",
    nullable: false,
  })
  appealStatus: StudentAppealStatus;
  /**
   * Date that the Ministry approved or denied the appeal.
   */
  @Column({
    name: "assessed_date",
    type: "timestamptz",
    nullable: true,
  })
  assessedDate?: Date;
  /**
   * Ministry user that approved or denied the appeal.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "assessed_by",
    referencedColumnName: ColumnNames.ID,
  })
  assessedBy?: User;
  /**
   * Note added by the Ministry while approving or denying the appeal.
   */
  @OneToOne(() => Note, { eager: false, cascade: ["insert"], nullable: true })
  @JoinColumn({
    name: "note_id",
    referencedColumnName: ColumnNames.ID,
  })
  note?: Note;
}
