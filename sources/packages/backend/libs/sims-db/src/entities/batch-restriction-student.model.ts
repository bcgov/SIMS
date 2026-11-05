import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { BatchRestriction, StudentRestriction } from ".";

export const BATCH_RESTRICTION_FAILURE_REASON_MAX_LENGTH = 250;

/**
 * Application number included in a batch restriction submission and the student restriction it resulted in.
 */
@Entity({ name: TableNames.BatchRestrictionStudents })
export class BatchRestrictionStudent extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Batch restriction submission that included this application number.
   */
  @ManyToOne(() => BatchRestriction, {
    nullable: false,
  })
  @JoinColumn({
    name: "batch_restriction_id",
    referencedColumnName: ColumnNames.ID,
  })
  batchRestriction: BatchRestriction;
  /**
   * Application number submitted to find the student.
   */
  @Column({
    name: "application_number",
  })
  applicationNumber: string;
  /**
   * Active student restriction of the student of the application number, either
   * added by the batch or already active. Null when the application number does not exist.
   */
  @ManyToOne(() => StudentRestriction)
  @JoinColumn({
    name: "student_restriction_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentRestriction?: StudentRestriction;
  /**
   * Reason the restriction could not be added to the student.
   * Null when the student has the restriction active.
   */
  @Column({
    name: "failure_reason",
    length: BATCH_RESTRICTION_FAILURE_REASON_MAX_LENGTH,
    nullable: true,
  })
  failureReason?: string;
}
