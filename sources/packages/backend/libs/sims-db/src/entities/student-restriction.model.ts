import {
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { BaseRestrictionModel } from "./base-restriction.model";
import {
  Student,
  Application,
  ApplicationRestrictionBypass,
  Note,
  User,
} from ".";

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

  /**
   * Application restriction bypasses related to this student restriction.
   */
  @OneToMany(
    () => ApplicationRestrictionBypass,
    (applicationRestrictionBypass) =>
      applicationRestrictionBypass.studentRestriction,
    {
      eager: false,
      cascade: false,
    },
  )
  applicationRestrictionBypasses?: ApplicationRestrictionBypass[];

  /**
   * Note added during restriction deletion.
   */
  @OneToOne(() => Note, { nullable: true })
  @JoinColumn({
    name: "deletion_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  deletionNote?: Note;

  /**
   * Date when the restriction was deleted.
   */
  @DeleteDateColumn({
    name: "deleted_at",
    type: "timestamptz",
    nullable: true,
  })
  deletedAt?: Date;

  /**
   * User who deleted the restriction.
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: "deleted_by",
    referencedColumnName: ColumnNames.ID,
  })
  deletedBy?: User;
}
