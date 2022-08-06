import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RecordDataModel } from ".";
import { ColumnNames, TableNames } from "../constant";
import { User } from "./user.model";

/**
 * Student account information to have the student identity data validated.
 * Upon a successful validation, a new student can be created or the user can
 * be associated with an existing one.
 */
@Entity({ name: TableNames.StudentAccountApplications })
export class StudentAccountApplication extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student information to be validated.
   */
  @Column({
    name: "submitted_data",
    type: "jsonb",
    nullable: false,
  })
  submittedData: any;
  /**
   * User that is requesting the data validation to become a student.
   */
  @ManyToOne(() => User, { eager: false, cascade: ["insert"] })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;
  /**
   * Date that the student account application was submitted by the student.
   */
  @Column({
    name: "submitted_date",
    type: "timestamptz",
    nullable: false,
  })
  submittedDate: Date;
  /**
   * Ministry user that approved the student account application.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "assessed_by",
    referencedColumnName: ColumnNames.ID,
  })
  assessedBy?: User;
  /**
   * Date that the Ministry user approved the student account application.
   */
  @Column({
    name: "assessed_date",
    type: "timestamptz",
    nullable: true,
  })
  assessedDate?: Date;
}
