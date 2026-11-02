import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { BatchRestriction, Student } from ".";

export const BATCH_RESTRICTION_IDENTIFIER_MAX_LENGTH = 50;
export const BATCH_RESTRICTION_FAILURE_REASON_MAX_LENGTH = 250;

/**
 * Student included in a batch restriction submission, identified by the submitted identifier.
 */
@Entity({ name: TableNames.BatchRestrictionStudents })
export class BatchRestrictionStudent extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Batch restriction submission that included this student.
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
   * Identifier submitted to find the student, of the type defined by the batch.
   */
  @Column({
    name: "identifier",
    length: BATCH_RESTRICTION_IDENTIFIER_MAX_LENGTH,
  })
  identifier: string;
  /**
   * Student found using the identifier. Null when no student was found.
   */
  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student?: Student;
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
