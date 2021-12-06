import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Restriction } from ".";
import { ColumnNames, TableNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";

/**
 * Represents the current snapshot of all federal restrictions
 * currently active.
 */
@Entity({ name: TableNames.FederalRestrictions })
export class FederalRestriction {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;
  /**
   * Last name of the student.
   */
  @Column({
    name: "last_name",
    nullable: false,
  })
  lastName: string;
  /**
   * Date of birth of the student.
   */
  @Column({
    name: "birth_date",
    type: "date",
    transformer: dateOnlyTransformer,
  })
  birthDate: Date;
  /**
   * SIN of the student.
   */
  @Column({
    name: "sin",
  })
  sin: string;
  /**
   * Restriction associated with federal record.
   */
  @ManyToOne(() => Restriction, {
    eager: false,
    cascade: true,
  })
  @JoinColumn({
    name: "restriction_id",
    referencedColumnName: ColumnNames.ID,
  })
  restriction: Restriction;
  /**
   * Record creation timestamp.
   */
  @CreateDateColumn({
    name: ColumnNames.CreateTimestamp,
  })
  createdAt: Date;
}
