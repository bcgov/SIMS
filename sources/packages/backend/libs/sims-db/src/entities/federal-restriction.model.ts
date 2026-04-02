import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Restriction, Student } from ".";
import { ColumnNames, TableNames } from "../constant";

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
  })
  birthDate: string;
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
    nullable: true,
  })
  @JoinColumn({
    name: "restriction_id",
    referencedColumnName: ColumnNames.ID,
  })
  restriction?: Restriction;
  /**
   * Record creation timestamp.
   */
  @CreateDateColumn({
    name: ColumnNames.CreateTimestamp,
  })
  createdAt: Date;
  /**
   * Student associated with the federal restriction.
   * This association happens after the federal restriction is created,
   * when the system tries to match the federal restriction with an
   * existing student on the database, based on the SIN, last name and birth date.
   */
  @ManyToOne(() => Student, {
    nullable: true,
  })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student?: Student;
}
