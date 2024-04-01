import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { numericTransformer } from "../transformers/numeric.transformer";
import { Student } from "./student.model";

/**
 * Stores files information and content from NSLSC
 * Loan Balance file.
 */
@Entity({ name: TableNames.StudentLoanBalances })
export class StudentLoanBalance extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student associated with this Loan Balance.
   */
  @ManyToOne(() => Student, { eager: false, cascade: false, nullable: false })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * Loan balance value (a positive value indicates the amount the student owes as NSLSC Loan).
   */
  @Column({
    name: "csl_balance",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  cslBalance: number;
  /**
   * Date when the balance date generated and shared by NSLSC.
   */
  @Column({
    name: "balance_date",
    type: "date",
    nullable: false,
  })
  balanceDate: string;
}
