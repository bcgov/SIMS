import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { BaseRestrictionModel } from "./base-restriction.model";
import { Student, Application } from ".";

/**
 * Entity for student restrictions
 */
@Entity({ name: TableNames.StudentRestrictions })
export class StudentRestriction extends BaseRestrictionModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student to whom the restriction is assigned
   */
  @ManyToOne(() => Student, { eager: false, cascade: false })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * Application on which the restriction was created
   */
  @ManyToOne(() => Application, { eager: false, cascade: false })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
}
