import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { Student } from "./student.model";
import { numericTransformer } from "../transformers/numeric.transformer";

/**
 * Stores files information and content from NSLSC
 * Loan Balance file.
 */
@Entity({ name: TableNames.StudentLoanBalances })
export class StudentLoanBalances extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student id associated with this Loan Balance.
   */
  studentId: number;
  /**
   * Student associated with this Loan Balance.
   */
  @ManyToOne(() => Student, { eager: false, cascade: false })
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
  })
  balanceDate: Date;
}
