import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Application, SupportingUser } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { numericTransformer } from "@sims/sims-db/transformers/numeric.transformer";

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
    type: "numeric",
    nullable: false,
    transformer: numericTransformer,
  })
  reportedIncome: number;
  /**
   * Total income value retrieved from CRA file
   * (currently line 15000 form tax file).
   */
  @Column({
    name: "cra_reported_income",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
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
   * Name of the file sent to CRA to request an income verification.
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
    name: "match_status_code",
    nullable: true,
  })
  matchStatusCode?: string;
  /**
   * Request status code returned from CRA (e.g. 01 - SUCCESSFUL-REQUEST).
   */
  @Column({
    name: "request_status_code",
    nullable: true,
  })
  requestStatusCode?: string;
  /**
   * Request status code returned from CRA
   * (00 - INACTIVE CODE NOT SET, 01 - INACTIVE CODE SET).
   */
  @Column({
    name: "inactive_code",
    nullable: true,
  })
  inactiveCode?: string;
  /**
   * Student Application that requires the income verification.
   */
  @ManyToOne(() => Application, { eager: false, cascade: false })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
  /**
   * Supporting user that requires a CRA income verification.
   */
  @ManyToOne(() => SupportingUser, { eager: true, cascade: false })
  @JoinColumn({
    name: "supporting_user_id",
    referencedColumnName: ColumnNames.ID,
  })
  supportingUser?: SupportingUser;
}
