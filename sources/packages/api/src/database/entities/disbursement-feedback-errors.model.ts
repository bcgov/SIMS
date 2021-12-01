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
import { RecordDataModel } from "./record.model";

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
   * Error Code.
   */
  @Column({
    name: "error_code",
  })
  errorCode: string;
  /**
   * Disbursement Schedule ids.
   */
  @RelationId(
    (disbursementValue: DisbursementFeedbackErrors) =>
      disbursementValue.disbursementSchedule,
  )
  disbursementScheduleId: number;
  /**
   * Disbursement Schedule.
   */
  @ManyToOne(() => DisbursementSchedule, { eager: false, cascade: false })
  @JoinColumn({
    name: "disbursement_schedule_id",
    referencedColumnName: ColumnNames.ID,
  })
  disbursementSchedule: DisbursementSchedule;
}
