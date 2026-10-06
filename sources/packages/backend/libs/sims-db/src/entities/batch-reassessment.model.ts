import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { BatchReassessmentApplication } from ".";

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
   * Sequential batch number displayed to users.
   */
  @Column({
    name: "batch_number",
    type: "integer",
    nullable: false,
  })
  batchNumber: number;
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
