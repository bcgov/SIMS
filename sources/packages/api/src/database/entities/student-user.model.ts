import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RecordDataModel } from ".";
import { ColumnNames, TableNames } from "../constant";
import { Student } from "./student.model";
import { User } from "./user.model";

/**
 * Students and users relationships, current and past ones.
 * Every time that a student/user association changes this
 * table will receive a new record to keep the audit.
 */
@Entity({ name: TableNames.StudentUser })
export class StudentUser extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * User related to the student.
   */
  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;
  /**
   * Student related to the user.
   */
  @ManyToOne(() => Student, { eager: false, nullable: false })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
}
