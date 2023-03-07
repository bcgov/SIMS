import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToOne,
} from "typeorm";
import {
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  RecordDataModel,
  Student,
  StudentAssessment,
  Note,
  User,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { numericTransformer } from "../transformers/numeric.transformer";

/**
 * Students overawards resulted from reassessments calculations.
 */
@Entity({ name: TableNames.DisbursementOverawards })
export class DisbursementOveraward extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student related to the overaward.
   */
  @ManyToOne(() => Student, { eager: false, cascade: false, nullable: false })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * Related assessment. When not present, it represents a manual entry.
   */
  @ManyToOne(() => StudentAssessment, {
    eager: false,
    cascade: false,
    nullable: true,
  })
  @JoinColumn({
    name: "student_assessment_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentAssessment?: StudentAssessment;
  /**
   * Related disbursement schedule. When not present, it represents a manual entry or an
   * overaward at the assessment level, not at the disbursement schedule level (award).
   */
  @ManyToOne(() => DisbursementSchedule, {
    eager: false,
    cascade: false,
    nullable: true,
  })
  @JoinColumn({
    name: "disbursement_schedule_id",
    referencedColumnName: ColumnNames.ID,
  })
  disbursementSchedule?: DisbursementSchedule;
  /**
   * Overaward value (a positive value indicates the amount the student owes).
   */
  @Column({
    name: "overaward_value",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  overawardValue: number;
  /**
   * Value code related to the overaward_value, for instance, CSLF, CSPT, BCSL.
   */
  @Column({
    name: "disbursement_value_code",
    nullable: false,
  })
  disbursementValueCode: string;
  /**
   * Origin of the record.
   */
  @Column({
    name: "origin_type",
    type: "enum",
    enum: DisbursementOverawardOriginType,
    enumName: "DisbursementOverawardOriginType",
    nullable: false,
  })
  originType: DisbursementOverawardOriginType;
  /**
   * When set indicates that the record is considered deleted.
   */
  @DeleteDateColumn({
    name: "deleted_at",
    type: "timestamptz",
    nullable: true,
  })
  deletedAt?: Date;
  /**
   * Note entered during manual overaward record added.
   */
  @OneToOne(() => Note, { eager: false, cascade: true })
  @JoinColumn({
    name: "note_id",
    referencedColumnName: ColumnNames.ID,
  })
  overawardNotes: Note;

  /**
   * User who added overaward manual record.
   */
  @OneToOne(() => User, { eager: true, cascade: true })
  @JoinColumn({
    name: "added_by",
    referencedColumnName: "id",
  })
  addedBy: User;

  /**
   * Date when the manual record was added.
   */
  @Column({
    name: "added_date",
  })
  addedDate?: Date;
}
