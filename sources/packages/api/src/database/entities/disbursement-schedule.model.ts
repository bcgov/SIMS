import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User, COEStatus, COEDeniedReason } from ".";
import { ColumnNames, TableNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";
import { DisbursementValue } from "./disbursement-values.model";
import { RecordDataModel } from "./record.model";
import { StudentAssessment } from "./student-assessment.model";

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
    enum: COEStatus,
    enumName: "COEStatus",
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
  coeUpdatedBy?: User;

  /**
   * Date on which COE is approved/rejected.
   */
  @Column({
    name: "coe_updated_at",
    type: "timestamptz",
    nullable: true,
  })
  coeUpdatedAt?: Date;

  /**
   * COE denied reason for denied COEs.
   */
  @ManyToOne(() => COEDeniedReason, {
    eager: false,
    cascade: false,
    nullable: true,
  })
  @JoinColumn({
    name: "coe_denied_id",
    referencedColumnName: ColumnNames.ID,
  })
  coeDeniedReason?: COEDeniedReason;

  /**
   * If the COE denied reason is other, the description of other reason.
   */
  @Column({
    name: "coe_denied_other_desc",
    nullable: true,
  })
  coeDeniedOtherDesc?: string;
  /**
   * Student assessment associated with this disbursement.
   */
  @ManyToOne(() => StudentAssessment, { eager: false, cascade: false })
  @JoinColumn({
    name: "student_assessment_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentAssessment: StudentAssessment;
}
