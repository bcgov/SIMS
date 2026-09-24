import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import {
  BatchReassessment,
  BatchReassessmentApplicationResult,
  StudentAssessment,
} from ".";

/**
 * Processing result for one application included in a batch manual reassessment.
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
    eager: false,
    cascade: false,
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
    type: "varchar",
    nullable: false,
  })
  applicationNumber: string;
  /**
   * Assessment created for the application when processing succeeds.
   */
  @ManyToOne(() => StudentAssessment, {
    nullable: true,
    eager: false,
    cascade: false,
  })
  @JoinColumn({
    name: "student_assessment_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentAssessment?: StudentAssessment;
  /**
   * Processing result for the application.
   */
  @Column({
    name: "result",
    type: "enum",
    enum: BatchReassessmentApplicationResult,
    enumName: "BatchReassessmentApplicationResult",
    nullable: false,
  })
  result: BatchReassessmentApplicationResult;
  /**
   * Reason the application failed batch manual reassessment processing.
   */
  @Column({
    name: "failure_reason",
    type: "text",
    nullable: true,
  })
  failureReason?: string;
}
