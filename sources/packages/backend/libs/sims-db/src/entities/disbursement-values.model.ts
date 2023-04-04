import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { numericTransformer } from "../transformers/numeric.transformer";
import { DisbursementSchedule } from "./disbursement-schedule.model";
import { DisbursementValueType } from "./disbursement-value-type";
import { RecordDataModel } from "./record.model";
import { Restriction } from "./restriction.model";

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
    enum: DisbursementValueType,
    enumName: "DisbursementValueType",
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
   */
  @Column({
    name: "value_amount",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  valueAmount: number;
  /**
   * Overaward amount value subtracted from the award calculated.
   */
  @Column({
    name: "overaward_amount_subtracted",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  overawardAmountSubtracted: number;
  /**
   * Value amount already disbursed for the same application and
   * the same award that was subtracted from the calculated award.
   */
  @Column({
    name: "disbursed_amount_subtracted",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  disbursedAmountSubtracted?: number;
  /**
   * Value resulted from the calculation between the award value_amount,
   * disbursed_amount_subtracted and overaward_amount_subtracted. This is
   * the value that was sent on the e-Cert and effectively paid to the student.
   */
  @Column({
    name: "effective_amount",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  effectiveAmount?: number;
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
  /**
   * Amount that is subtracted because of a restriction.
   */
  @Column({
    name: "restriction_amount_subtracted",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  restrictionAmountSubtracted?: number;
  /**
   * References the restriction related to the disbursement
   * due to which the amount was subtracted.
   */
  @RelationId(
    (disbursementValue: DisbursementValue) =>
      disbursementValue.restrictionSubtracted,
  )
  restrictionIdSubtracted?: number;
  /**
   * Restriction id due to which the award amount was reduced.
   */
  @ManyToOne(() => Restriction, {
    eager: false,
    cascade: false,
  })
  @JoinColumn({
    name: "restriction_id_subtracted",
    referencedColumnName: ColumnNames.ID,
  })
  restrictionSubtracted?: Restriction;
}
