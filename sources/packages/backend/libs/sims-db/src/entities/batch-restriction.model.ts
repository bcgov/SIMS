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
import { BatchRestrictionIdentifierType } from "./batch-restriction-identifier-type.type";

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
    type: "integer",
    nullable: false,
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
   * Type of the identifier used to find the students in the batch.
   */
  @Column({
    name: "identifier_type",
    type: "enum",
    enum: BatchRestrictionIdentifierType,
    enumName: "BatchRestrictionIdentifierType",
  })
  identifierType: BatchRestrictionIdentifierType;
  /**
   * Students included in the batch.
   */
  @OneToMany(
    () => BatchRestrictionStudent,
    (batchStudent) => batchStudent.batchRestriction,
    {
      cascade: ["insert", "update"],
      nullable: false,
    },
  )
  batchRestrictionStudents: BatchRestrictionStudent[];
}
