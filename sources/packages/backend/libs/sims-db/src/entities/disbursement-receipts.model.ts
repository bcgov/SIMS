import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DisbursementSchedule, DisbursementReceiptValue } from ".";
import { ColumnNames, TableNames } from "../constant";
import { numericTransformer } from "../transformers/numeric.transformer";
import { RecordDataModel } from "./record.model";

/**
 * Known code for the federal receipt funding type.
 */
export const RECEIPT_FUNDING_TYPE_FEDERAL = "FE";
/**
 * Known code for the provincial receipt funding type.
 */
export const RECEIPT_FUNDING_TYPE_PROVINCIAL = "BC";

/**
 * Disbursement receipts received from ESDC for the disbursements sent.
 */
@Entity({ name: TableNames.DisbursementReceipts })
export class DisbursementReceipt extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Effective date of data on the disbursement receipt file.
   */
  @Column({
    name: "batch_run_date",
    type: "date",
    nullable: false,
  })
  batchRunDate: string;

  /**
   * SIN number of the student who received the disbursement.
   */
  @Column({
    name: "student_sin",
    nullable: false,
  })
  studentSIN: string;

  /**
   * Disbursement id to which the document number from the file belongs to.
   */
  @ManyToOne(() => DisbursementSchedule, { eager: false, nullable: false })
  @JoinColumn({
    name: "disbursement_schedule_id",
    referencedColumnName: ColumnNames.ID,
  })
  disbursementSchedule: DisbursementSchedule;

  /**
   * Indicates the funding type of the disbursement receipt item. Values can have FE(Federal) or BC(Provincial).
   */
  @Column({
    name: "funding_type",
    nullable: false,
  })
  fundingType: string;

  /**
   * Total entitled loan disbursed amount for either FE(Federal) or BC(Provincial).
   */
  @Column({
    name: "total_entitled_disbursed_amount",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  totalEntitledDisbursedAmount: number;

  /**
   * Total loan disbursed amount for either FE(Federal) or BC(Provincial).
   */
  @Column({
    name: "total_disbursed_amount",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  totalDisbursedAmount: number;

  /**
   * Financial posting date of NSLSC.
   */
  @Column({
    name: "disburse_date",
    type: "date",
    nullable: false,
  })
  disburseDate: string;

  /**
   * Amount disbursed to the student.
   */
  @Column({
    name: "disburse_amount_student",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  disburseAmountStudent: number;

  /**
   * Amount disbursed to the institution.
   */
  @Column({
    name: "disburse_amount_institution",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  disburseAmountInstitution: number;

  /**
   * The date signed by the institution of the student at the time they receive the loan certificate.
   */
  @Column({
    name: "date_signed_institution",
    type: "date",
    nullable: false,
  })
  dateSignedInstitution: string;

  /**
   * Institution code.
   */
  @Column({
    name: "institution_code",
    nullable: false,
  })
  institutionCode: string;

  /**
   * Method of disbursement to student, where C(cheque), E(EFT), or empty space for disbursement only to institution.
   */
  @Column({
    name: "disburse_method_student",
    nullable: false,
  })
  disburseMethodStudent: string;

  /**
   * Total Federal or BC grant entitled amount.
   */
  @Column({
    name: "total_entitled_grant_amount",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  totalEntitledGrantAmount: number;

  /**
   * Total Federal or BC grant disbursed amount.
   */
  @Column({
    name: "total_disbursed_grant_amount",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  totalDisbursedGrantAmount: number;

  /**
   * Total Federal or BC grant disbursed amount to student.
   */
  @Column({
    name: "total_disbursed_grant_amount_student",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  totalDisbursedGrantAmountStudent: number;

  /**
   * Total Federal or BC grant disbursed amount to institution.
   */
  @Column({
    name: "total_disbursed_grant_amount_institution",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  totalDisbursedGrantAmountInstitution: number;

  /**
   * Values for this disbursement.
   */
  @OneToMany(
    () => DisbursementReceiptValue,
    (disbursementReceiptValue) => disbursementReceiptValue.disbursementReceipt,
    {
      eager: false,
      cascade: ["insert"],
      nullable: true,
    },
  )
  disbursementReceiptValues?: DisbursementReceiptValue[];

  /**
   * Study period end date.
   */
  @Column({
    name: "study_period_end_date",
    type: "date",
    nullable: false,
  })
  studyPeriodEndDate: string;

  /**
   * This reflects the date when the NSLSC file was produced.
   */
  @Column({
    name: "file_date",
    type: "date",
    nullable: false,
  })
  fileDate: string;

  /**
   * This reflects the sequence number as produced by NSLSC report.
   */
  @Column({
    name: "sequence_number",
    type: "integer",
    nullable: false,
    transformer: numericTransformer,
  })
  sequenceNumber: number;
}
