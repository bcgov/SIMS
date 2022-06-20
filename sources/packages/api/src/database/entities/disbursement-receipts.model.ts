import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsDate,
  IsNotEmpty,
  Length,
  ValidateNested,
} from "class-validator";
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
  @IsDate()
  batchRunDate: Date;

  /**
   * SIN number of the student who received the disbursement.
   */
  @Column({
    name: "student_sin",
    nullable: false,
  })
  @Length(9)
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
  @Length(2)
  fundingType: string;

  /**
   * Total entitled disbursed amount for either FE(Federal) or BC(Provincial)..
   */
  @Column({
    name: "total_entitled_disbursed_amount",
    type: "numeric",
    nullable: false,
  })
  @IsNotEmpty()
  totalEntitledDisbursedAmount: string;

  /**
   * Total disbursed amount for either FE(Federal) or BC(Provincial)..
   */
  @Column({
    name: "total_disbursed_amount",
    type: "numeric",
    nullable: false,
  })
  @IsNotEmpty()
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
  @IsDate()
  disburseDate: Date;

  /**
   * Amount disbursed to the student.
   */
  @Column({
    name: "disburse_amount_student",
    type: "numeric",
    nullable: false,
  })
  @IsNotEmpty()
  disburseAmountStudent: string;

  /**
   * Amount disbursed to the institution.
   */
  @Column({
    name: "disburse_amount_institution",
    type: "numeric",
    nullable: false,
  })
  @IsNotEmpty()
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
  @IsDate()
  dateSignedInstitution: Date;

  /**
   * Institution code.
   */
  @Column({
    name: "institution_code",
    nullable: false,
  })
  @Length(4)
  institutionCode: string;

  /**
   * Method of disbursement to student. C(By cheque),E(By EFT), <space> disbursement only to institution.
   */
  @Column({
    name: "disburse_method_student",
    nullable: false,
  })
  @Length(1)
  disburseMethodStudent: string;

  /**
   * Total Federal or BC grant entitled amount.
   */
  @Column({
    name: "total_entitled_grant_amount",
    type: "numeric",
    nullable: false,
  })
  @IsNotEmpty()
  totalEntitledGrantAmount: string;

  /**
   * Total Federal or BC grant disbursed amount.
   */
  @Column({
    name: "total_disbursed_grant_amount",
    type: "numeric",
    nullable: false,
  })
  @IsNotEmpty()
  totalDisbursedGrantAmount: string;

  /**
   * Total Federal or BC grant disbursed amount to student.
   */
  @Column({
    name: "total_disbursed_grant_amount_student",
    type: "numeric",
    nullable: false,
  })
  @IsNotEmpty()
  totalDisbursedGrantAmountStudent: string;

  /**
   * Total Federal or BC grant disbursed amount to institution.
   */
  @Column({
    name: "total_disbursed_grant_amount_institution",
    type: "numeric",
    nullable: false,
  })
  @IsNotEmpty()
  totalDisbursedGrantAmountInstitution: string;

  /**
   * Values for this disbursement.
   */
  @OneToMany(
    () => DisbursementReceiptValue,
    (disbursementReceiptValue) => disbursementReceiptValue.disbursementReceipt,
    {
      eager: true,
      cascade: true,
      nullable: true,
    },
  )
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => DisbursementReceiptValue)
  disbursementReceiptValues?: DisbursementReceiptValue[];

  /**
   * Study period end date.
   */
  @Column({
    name: "study_period_end_date",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: false,
  })
  @IsDate()
  studyPeriodEndDate: Date;
}
