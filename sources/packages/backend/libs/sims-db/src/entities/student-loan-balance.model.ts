import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { numericTransformer } from "../transformers/numeric.transformer";

/**
 * Stores files information and content from NSLSC
 * Loan Balance file.
 */
@Entity({ name: TableNames.StudentLoanBalances })
export class StudentLoanBalance extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student id associated with this Loan Balance.
   */
  @Column({
    name: "student_id",
    type: "integer",
    nullable: false,
  })
  studentId: number;
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
