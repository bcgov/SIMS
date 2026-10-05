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
import { BatchReassessment, StudentAssessment } from ".";

export const FAILURE_REASON_MAX_LENGTH = 250;

/**
 * Details of an application included in a batch manual reassessment.
 */
@Entity({ name: TableNames.BatchReassessmentApplications })
export class BatchReassessmentApplication extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Batch manual reassessment that included this application.
   */
  @ManyToOne(() => BatchReassessment, {
    nullable: false,
  })
  @JoinColumn({
    name: "batch_reassessment_id",
    referencedColumnName: ColumnNames.ID,
  })
  batchReassessment: BatchReassessment;
  /**
   * Application number submitted for this batch manual reassessment.
   */
  @Column({
    name: "application_number",
  })
  applicationNumber: string;
  /**
   * Assessment created for the application when processing succeeds.
   */
  @OneToOne(() => StudentAssessment)
  @JoinColumn({
    name: "student_assessment_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentAssessment?: StudentAssessment;
  /**
   * Reason the application failed batch manual reassessment processing.
   */
  @Column({
    name: "failure_reason",
    length: FAILURE_REASON_MAX_LENGTH,
    nullable: true,
  })
  failureReason?: string;
}
