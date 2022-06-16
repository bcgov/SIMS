import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { DisbursementSchedule, DisbursementReceiptValue } from ".";
import { ColumnNames, TableNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";
import { RecordDataModel } from "./record.model";

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
    transformer: dateOnlyTransformer,
    nullable: false,
  })
  batchRunDate: Date;

  /**
   * SIN number of the student who received the disbursement.
   */
  @Column({
    name: "student_sin",
    nullable: false,
  })
  studentSIN: string;

  /**
   * Disbursement id to which the document number from the file belongs to..
   */
  @ManyToOne(() => DisbursementSchedule, { eager: false, nullable: false })
  @JoinColumn({
    name: "disbursement_schedule_id",
    referencedColumnName: ColumnNames.ID,
  })
  disbursementSchedule: DisbursementSchedule;

  /**
   * disbursement schedule id.
   */
  @RelationId(
    (disbursementReceipt: DisbursementReceipt) =>
      disbursementReceipt.disbursementSchedule,
  )
  disbursementScheduleId: number;

  /**
   * Indicates the funding type of the disbursement receipt item. Values can have FE(Federal) or BC(Provincial)..
   */
  @Column({
    name: "funding_type",
    nullable: false,
  })
  fundingType: string;

  /**
   * Total entitled disbursed amount for either FE(Federal) or BC(Provincial)..
   */
  @Column({
    name: "total_entitled_disbursed_amount",
    type: "numeric",
    nullable: false,
  })
  totalEntitledDisbursedAmount: string;

  /**
   * Total disbursed amount for either FE(Federal) or BC(Provincial)..
   */
  @Column({
    name: "total_disbursed_amount",
    type: "numeric",
    nullable: false,
  })
  totalDisbursedAmount: string;

  /**
   * Financial posting date of NSLSC.
   */
  @Column({
    name: "disburse_date",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: false,
  })
  disburseDate: Date;

  /**
   * Amount disbursed to the student.
   */
  @Column({
    name: "disburse_amount_student",
    type: "numeric",
    nullable: false,
  })
  disburseAmountStudent: string;

  /**
   * Amount disbursed to the institution.
   */
  @Column({
    name: "disburse_amount_institution",
    type: "numeric",
    nullable: false,
  })
  disburseAmountInstitution: string;

  /**
   * The date signed by the institution of the student at the time they receive the loan certificate.
   */
  @Column({
    name: "date_signed_institution",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: false,
  })
  dateSignedInstitution: Date;

  /**
   * Institution code.
   */
  @Column({
    name: "institution_code",
    nullable: false,
  })
  institutionCode: string;

  /**
   * Method of disbursement to student. C(By cheque),E(By EFT), <space> disbursement only to institution.
   */
  @Column({
    name: "disburse_method_student",
    nullable: false,
  })
  disburseMethodStudent: string;

  /**
   * Values for this disbursement.
   */
  @OneToMany(
    () => DisbursementReceiptValue,
    (disbursementReceiptValue) => disbursementReceiptValue.disbursementReceipt,
    {
      eager: false,
      cascade: true,
      nullable: false,
    },
  )
  disbursementReceiptValues: DisbursementReceiptValue[];

  /**
   * Study period end date.
   */
  @Column({
    name: "study_period_end_date",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: false,
  })
  studyPeriodEndDate: Date;
}
