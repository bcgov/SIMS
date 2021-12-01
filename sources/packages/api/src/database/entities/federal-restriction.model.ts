import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Restriction, Student } from ".";
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
   * Last name.
   */
  @Column({
    name: "last_name",
    nullable: false,
  })
  lastName: string;
  /**
   * Date of birth.
   */
  @Column({
    name: "birth_date",
    type: "date",
    transformer: dateOnlyTransformer,
  })
  birthDate: Date;
  /**
   * Social Insurance Number for the student.
   */
  @Column({
    name: "sin",
  })
  sin: string;
  /**
   * Restriction code associated with federal restriction.
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
}
