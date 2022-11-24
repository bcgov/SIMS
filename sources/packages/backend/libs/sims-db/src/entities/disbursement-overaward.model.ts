import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  RecordDataModel,
  Student,
} from ".";
import { ColumnNames, TableNames } from "../constant";

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
   * Related disbursement schedule. When not present, it represents a manual entry.
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
    type: "decimal",
    nullable: false,
  })
  overawardValue: string;
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
}
