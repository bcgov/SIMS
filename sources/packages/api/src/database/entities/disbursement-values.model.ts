import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { DisbursementSchedule } from "./disbursement-schedule.model";
import { DisbursementValueType } from "./disbursement-value-type";
import { RecordDataModel } from "./record.model";

/**
 * Disbursements values for each schedule on a Student Application.
 * For each disbursement date there are a few values associated with it
 * that represents the loans and grants to be disbursed.
 */
@Entity({ name: TableNames.DisbursementValue })
export class DisbursementValue extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Generic type of the value (e.g. Canada Loan or BC Loan).
   */
  @Column({
    name: "value_type",
    type: "enum",
    nullable: false,
  })
  valueType: DisbursementValueType;
  /**
   * Specific code for the loan/grant to be disbursed (e.g. CSLF or BCSL).
   */
  @Column({
    name: "value_code",
    nullable: false,
  })
  valueCode: string;
  /**
   * Amount of money to be disbursed for one particular loan/grant.
   * !Decimal values are retrieved by Typeorm as string from Postgres.
   */
  @Column({
    name: "value_amount",
    type: "numeric",
    nullable: false,
  })
  valueAmount: string;
  /**
   * Disbursement value ids.
   */
  @RelationId(
    (disbursementValue: DisbursementValue) =>
      disbursementValue.disbursementSchedule,
  )
  disbursementScheduleId: number;
  /**
   * Disbursement values.
   */
  @ManyToOne(() => DisbursementSchedule, { eager: false, cascade: false })
  @JoinColumn({
    name: "disbursement_schedule_id",
    referencedColumnName: ColumnNames.ID,
  })
  disbursementSchedule: DisbursementSchedule;
}
