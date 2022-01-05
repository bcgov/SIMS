import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { Student, Application, Restriction, Note } from ".";

/**
 * Entity for student restrictions
 */
@Entity({ name: TableNames.StudentRestrictions })
export class StudentRestriction extends RecordDataModel {
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
  /**
   * Restriction details
   */
  @ManyToOne(() => Restriction, { eager: false, cascade: false })
  @JoinColumn({
    name: "restriction_id",
    referencedColumnName: ColumnNames.ID,
  })
  restriction: Restriction;
  /**
   * Active flag which decides if the restriction is active
   */
  @Column({
    name: "is_active",
    nullable: false,
  })
  isActive: boolean;
  /**
   * Note entered during restriction creation.
   */
  @OneToOne(() => Note, { eager: false, cascade: true })
  @JoinColumn({
    name: "restriction_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  restrictionNote: Note;
  /**
   * Note entered during restriction resolution.
   */
  @OneToOne(() => Note, { eager: false, cascade: true })
  @JoinColumn({
    name: "resolution_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  resolutionNote: Note;
}
