import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import {
  User,
  COEStatus,
  COEDeniedReason,
  DisbursementScheduleStatus,
  MSFAANumber,
  DisbursementReceipt,
  DisbursementFeedbackErrors,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { DisbursementValue } from "./disbursement-values.model";
import { RecordDataModel } from "./record.model";
import { StudentAssessment } from "./student-assessment.model";
import { numericTransformer } from "../transformers/numeric.transformer";

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
    nullable: false,
  })
  disbursementDate: string;
  /**
   * The maximum date that this document is valid to.
   */
  @Column({
    name: "negotiated_expiry_date",
    type: "date",
    nullable: false,
  })
  negotiatedExpiryDate: string;
  /**
   * Date that this disbursement was sent to ESDC.
   */
  @Column({
    name: "date_sent",
    type: "timestamptz",
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
      cascade: ["insert", "update"],
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
  /**
   * Tuition remittance amount requested by the institution for disbursement.
   */
  @Column({
    name: "tuition_remittance_requested_amount",
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  tuitionRemittanceRequestedAmount: number;
  /**
   * Indicates if the money amount information was already sent to be paid to the student.
   */
  @Column({
    name: "disbursement_schedule_status",
    type: "enum",
    enum: DisbursementScheduleStatus,
    enumName: "DisbursementScheduleStatus",
    nullable: false,
  })
  disbursementScheduleStatus: DisbursementScheduleStatus;
  /**
   * Audit column to identify the date-time at which the disbursement
   * calculations are done and ready to be added to an e-Cert.
   */
  @Column({
    name: "ready_to_send_date",
    type: "timestamptz",
    nullable: true,
  })
  readyToSendDate?: Date;
  /**
   * Tuition remittance effective amount of a disbursement.
   */
  @Column({
    name: "tuition_remittance_effective_amount",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  tuitionRemittanceEffectiveAmount?: number;

  /**
   * Id of the MSFAA (Master Student Financial Aid Agreement)
   * number generated for a student.
   */
  @RelationId(
    (disbursementSchedule: DisbursementSchedule) =>
      disbursementSchedule.msfaaNumber,
  )
  msfaaNumberId?: number;
  /**
   * MSFAA (Master Student Financial Aid Agreement)
   * number generated for a student.
   */
  @ManyToOne(() => MSFAANumber, {
    eager: false,
    cascade: ["update"],
    nullable: true,
  })
  @JoinColumn({
    name: "msfaa_number_id",
    referencedColumnName: ColumnNames.ID,
  })
  msfaaNumber?: MSFAANumber;

  /**
   * Disbursement receipts for a disbursement schedule.
   ** Every disbursement schedule has disbursement receipt
   ** of type FE and BC.
   */
  @OneToMany(
    () => DisbursementReceipt,
    (disbursementReceipt) => disbursementReceipt.disbursementSchedule,
    {
      eager: false,
      cascade: false,
      nullable: true,
    },
  )
  disbursementReceipts?: DisbursementReceipt[];

  /**
   * Disbursement feedback errors for a disbursement schedule.
   */
  @OneToMany(
    () => DisbursementFeedbackErrors,
    (disbursementFeedbackErrors) =>
      disbursementFeedbackErrors.disbursementSchedule,
    {
      eager: false,
      cascade: false,
      nullable: true,
    },
  )
  disbursementFeedbackErrors?: DisbursementFeedbackErrors[];

  /**
   * Indication for whether the disbursement has estimated awards
   * against the $0 total disbursement value.
   */
  @Column({
    name: "has_estimated_awards",
    type: "boolean",
    nullable: false,
  })
  hasEstimatedAwards: boolean;
}
