import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Application, Student, StudentAssessment } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { StudentAppealRequest } from "./student-appeal-requests.model";

/**
 * Represents as set of appeals requested by a student, for instance, to have his income
 * or dependents data changed on his Student Application after it was completed.
 */
@Entity({ name: TableNames.StudentAppeals })
export class StudentAppeal extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Date that the student submitted the appeals.
   */
  @Column({
    name: "submitted_date",
    type: "timestamptz",
    nullable: false,
  })
  submittedDate: Date;
  /**
   * Application related to this student appeal
   * when the appeal is regarding an application issue.
   */
  @ManyToOne(() => Application, {
    eager: false,
    cascade: ["update"],
    nullable: true,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application?: Application;
  /**
   * Student related to this student appeal.
   * An appeal may or may not be linked to an application, but it must be linked to a student.
   */
  @ManyToOne(() => Student)
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * Individual appeals that belongs to the same request.
   */
  @OneToMany(
    () => StudentAppealRequest,
    (studentAppealRequest) => studentAppealRequest.studentAppeal,
    {
      eager: false,
      cascade: true,
      nullable: false,
    },
  )
  appealRequests: StudentAppealRequest[];
  /**
   * Student assessment associated with this student appeal.
   * Created only upon Ministry approval of at least one of
   * the appeal requests.
   */
  @OneToOne(
    () => StudentAssessment,
    (studentAssessment) => studentAssessment.studentAppeal,
    {
      eager: false,
      cascade: ["insert", "update"],
      nullable: true,
    },
  )
  studentAssessment?: StudentAssessment;
}
