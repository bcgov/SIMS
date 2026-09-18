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
  Application,
  BatchReassessment,
  BatchReassessmentApplicationResult,
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
   * Application processed for this batch manual reassessment.
   */
  @ManyToOne(() => Application, { eager: false, cascade: false })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
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
