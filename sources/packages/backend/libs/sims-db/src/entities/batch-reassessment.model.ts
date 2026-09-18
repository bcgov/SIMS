import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { BatchReassessmentApplication, BatchReassessmentStatus, User } from ".";

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
   * Date that the batch manual reassessment was submitted.
   */
  @Column({
    name: "submitted_date",
    type: "timestamptz",
    nullable: false,
  })
  submittedDate: Date;
  /**
   * Ministry user that submitted the batch manual reassessment.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: false })
  @JoinColumn({
    name: "submitted_by",
    referencedColumnName: ColumnNames.ID,
  })
  submittedBy: User;
  /**
   * Final processing status of the batch manual reassessment.
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
