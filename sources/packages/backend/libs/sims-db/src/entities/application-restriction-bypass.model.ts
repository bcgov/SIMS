import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import {
  User,
  Note,
  RecordDataModel,
  Application,
  StudentRestriction,
  RestrictionBypassBehaviors,
} from "@sims/sims-db";

/**
 * Restrictions bypass that allow awards to be disbursed ignoring
 * restrictions at the student application level.
 */
@Entity({ name: TableNames.ApplicationRestrictionBypasses })
export class ApplicationRestrictionBypass extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Reference to the student application that will have the bypass applied.
   */
  @ManyToOne(() => Application, {
    eager: false,
    cascade: ["update"],
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;

  /**
   * Active student restriction to be bypassed.
   */
  @ManyToOne(() => StudentRestriction, {
    eager: false,
    cascade: ["update"],
  })
  @JoinColumn({
    name: "student_restriction_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentRestriction: StudentRestriction;

  /**
   * Defines how the bypass should behave, for instance, until when it will be valid.
   */
  @Column({
    name: "bypass_behavior",
    type: "enum",
    enum: RestrictionBypassBehaviors,
    enumName: "RestrictionBypassBehaviors",
  })
  bypassBehavior: RestrictionBypassBehaviors;

  /**
   * Indicates if the bypass should be considered active.
   */
  @Column({
    name: "is_active",
  })
  isActive: boolean;

  /**
   * Note when the bypass was created.
   */
  @OneToOne(() => Note, { eager: false, cascade: false })
  @JoinColumn({
    name: "creation_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  creationNote: Note;

  /**
   * User that created the bypass.
   */
  @ManyToOne(() => User, { eager: false, cascade: false })
  @JoinColumn({
    name: "bypass_created_by",
    referencedColumnName: ColumnNames.ID,
  })
  bypassCreatedBy: User;

  /**
   * Date and time the bypass was created.
   */
  @Column({
    name: "assessed_date",
    type: "timestamptz",
  })
  bypassCreatedDate: Date;

  /**
   * Note when the bypass was removed.
   */
  @OneToOne(() => Note, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "removal_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  removalNote?: Note;

  /**
   * User that removed the bypass.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "bypass_removed_by",
    referencedColumnName: ColumnNames.ID,
  })
  bypassRemovedBy?: User;

  /**
   * Date and time the bypass was removed.
   */
  @Column({
    name: "bypass_removed_date",
    type: "timestamptz",
    nullable: true,
  })
  bypassRemovedDate?: Date;
}
