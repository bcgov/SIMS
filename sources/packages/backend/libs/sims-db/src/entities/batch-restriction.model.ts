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
import { BatchRestrictionStudent, Restriction } from ".";

/**
 * Batch restrictions submitted by a ministry user.
 */
@Entity({ name: TableNames.BatchRestrictions })
export class BatchRestriction extends RecordDataModel {
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
  })
  batchNumber: number;
  /**
   * Restriction added to all the students in the batch.
   */
  @ManyToOne(() => Restriction, { nullable: false })
  @JoinColumn({
    name: "restriction_id",
    referencedColumnName: ColumnNames.ID,
  })
  restriction: Restriction;
  /**
   * Students included in the batch.
   */
  @OneToMany(
    () => BatchRestrictionStudent,
    (batchRestrictionStudent) => batchRestrictionStudent.batchRestriction,
  )
  batchRestrictionStudents: BatchRestrictionStudent[];
}
