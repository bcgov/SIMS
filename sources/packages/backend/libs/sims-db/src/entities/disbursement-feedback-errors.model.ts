import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { DisbursementSchedule } from "./disbursement-schedule.model";
import { RecordDataModel } from "./record.model";
import { ECertFeedbackError } from "./ecert-feedback-error.model";

/**
 * Disbursement feedback errors codes for each schedule on a Student Application.
 * coming from the E-Cert feedback file.
 */
@Entity({ name: TableNames.DisbursementFeedbackErrors })
export class DisbursementFeedbackErrors extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Date received the error codes from the E-Cert feedback File.
   */
  @Column({
    name: "date_received",
    type: "timestamptz",
  })
  dateReceived: Date;
  /**
   * Disbursement Schedule.
   */
  @ManyToOne(() => DisbursementSchedule, { eager: false, cascade: false })
  @JoinColumn({
    name: "disbursement_schedule_id",
    referencedColumnName: ColumnNames.ID,
  })
  disbursementSchedule: DisbursementSchedule;

  /**
   * E-Cert feedback error received.
   */
  @ManyToOne(() => ECertFeedbackError, { eager: false, cascade: false })
  @JoinColumn({
    name: "ecert_feedback_error_id",
    referencedColumnName: ColumnNames.ID,
  })
  eCertFeedbackError: ECertFeedbackError;
}
