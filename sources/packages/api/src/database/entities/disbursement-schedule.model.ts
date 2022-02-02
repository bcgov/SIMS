import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Application, User, COEStatus } from ".";
import { ColumnNames, TableNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";
import { DisbursementValue } from "./disbursement-values.model";
import { RecordDataModel } from "./record.model";

/**
 * Dates when each disbursement will happen. Usually the disbursements
 * will happen on one or two dates when multiples loan/grants will
 * be disbursed.
 */
@Entity({ name: TableNames.DisbursementSchedule })
export class DisbursementSchedule extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Financial document number associated with this disbursement.
   */
  @Column({
    name: "document_number",
    nullable: true,
  })
  documentNumber?: number;
  /**
   * Date that the money must be disbursed.
   */
  @Column({
    name: "disbursement_date",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: false,
  })
  disbursementDate: Date;
  /**
   * The maximum date that this document is valid to.
   */
  @Column({
    name: "negotiated_expiry_date",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: false,
  })
  negotiatedExpiryDate: Date;
  /**
   * Date that this disbursement was sent to ESDC.
   */
  @Column({
    name: "date_sent",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: true,
  })
  dateSent?: Date;
  /**
   * Application associated with this disbursement.
   */
  @ManyToOne(() => Application, { eager: false, cascade: false })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
  /**
   * Values for this disbursement.
   */
  @OneToMany(
    () => DisbursementValue,
    (disbursementValue) => disbursementValue.disbursementSchedule,
    {
      eager: false,
      cascade: true,
      onDelete: "CASCADE",
      nullable: true,
    },
  )
  disbursementValues?: DisbursementValue[];

  /**
   * COE approval status of disbursement.
   */
  @Column({
    name: "coe_status",
    type: "enum",
  })
  coeStatus: COEStatus;

  /**
   * User who approved/rejected COE.
   */
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({
    name: "coe_updated_by",
    referencedColumnName: ColumnNames.ID,
  })
  coeUpdatedBy: User;

  /**
   * Date on which COE is approved/rejected.
   */
  @Column({
    name: "coe_updated_at",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: true,
  })
  coeUpdatedAt: Date;
}
