import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Application } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * Income verifications that must be performed with CRA.
 */
@Entity({ name: TableNames.CRAIncomeVerification })
export class CRAIncomeVerification extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Tax year to perform the income verification.
   */
  @Column({
    name: "tax_year",
    type: "smallint",
    nullable: false,
  })
  taxYear: number;
  /**
   * User reported income (e.g. reported on Student Application).
   */
  @Column({
    name: "reported_income",
    nullable: false,
  })
  reportedIncome: number;
  /**
   * Total income value retrieved from CRA file
   * (currently line 15000 form tax file).
   */
  @Column({
    name: "cra_reported_income",
    nullable: true,
  })
  craReportedIncome?: number;
  /**
   * Date and time that the income request file was generated
   * and sent to CRA for verification.
   */
  @Column({
    name: "date_sent",
    nullable: true,
  })
  dateSent?: Date;
  /**
   * Date and time that the CRA sent a response for an
   * income verification.
   */
  @Column({
    name: "date_received",
    nullable: true,
  })
  dateReceived?: Date;
  /**
   * Name of the file sent to CRA to request a income verification.
   */
  @Column({
    name: "file_sent",
    nullable: true,
  })
  fileSent?: string;
  /**
   * Name of the file received from CRA with the response
   * for an income verification.
   */
  @Column({
    name: "file_received",
    nullable: true,
  })
  fileReceived?: string;
  /**
   * Match status code returned from CRA (e.g. 01 - SUCCESSFUL-MATCH).
   */
  @Column({
    name: "match_status",
    nullable: true,
  })
  matchStatus?: string;
  /**
   * Request status code returned from CRA (e.g. 01 - SUCCESSFUL-REQUEST).
   */
  @Column({
    name: "request_status",
    nullable: true,
  })
  requestStatus?: string;
  /**
   * Student Application id that requires the income verification.
   */
  @RelationId(
    (carIncomeVerification: CRAIncomeVerification) =>
      carIncomeVerification.application,
  )
  applicationId: number;
  /**
   * Student Application that requires the income verification.
   */
  @ManyToOne(() => Application, { eager: false, cascade: true })
  @JoinColumn({
    name: "application_Id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
}
