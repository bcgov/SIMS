import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { BatchReassessmentApplication, BatchReassessmentStatus } from ".";

/**
 * Batch manual reassessment submitted by a ministry user.
 */
@Entity({ name: TableNames.BatchReassessments })
export class BatchReassessment extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   *Processing status of the batch manual reassessment.
   */
  @Column({
    name: "status",
    type: "enum",
    enum: BatchReassessmentStatus,
    enumName: "BatchReassessmentStatus",
    nullable: false,
  })
  status: BatchReassessmentStatus;
  /**
   * Applications included in the batch manual reassessment.
   */
  @OneToMany(
    () => BatchReassessmentApplication,
    (batchApplication) => batchApplication.batchReassessment,
    {
      cascade: ["insert", "update"],
      nullable: false,
    },
  )
  batchReassessmentApplications: BatchReassessmentApplication[];
}
