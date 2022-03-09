import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { User } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * SIN Validations that must be performed with CRA.
 */
@Entity({ name: TableNames.SINValidations })
export class SINValidation extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Date and time that the SIN validation file was generated
   * and sent.
   */
  @Column({
    name: "date_sent",
    nullable: true,
    type: "timestamptz",
  })
  dateSent?: Date;
  /**
   * Date and time that the received response file is processed for
   * SIN validation.
   */
  @Column({
    name: "date_received",
    nullable: true,
    type: "timestamptz",
  })
  dateReceived?: Date;
  /**
   * Name of the file sent for SIN validation.
   */
  @Column({
    name: "file_sent",
    nullable: true,
  })
  fileSent?: string;
  /**
   * Name of the file received for SIN validation.
   */
  @Column({
    name: "file_received",
    nullable: true,
  })
  fileReceived?: string;
  /**
   * Given Name sent in the file sent for SIN validation.
   */
  @Column({
    name: "given_name_sent",
    nullable: true,
  })
  givenNameSent?: string;
  /**
   * Surname sent in the file sent for SIN validation.
   */
  @Column({
    name: "surname_sent",
    nullable: true,
  })
  surnameSent?: string;
  /**
   * DOB Name sent in the file sent for SIN validation.
   */
  @Column({
    name: "dob_sent",
    nullable: true,
  })
  dobSent?: Date;
  /**
   * SIN is validated or not(e.g. null - SIN record is not sent for validation, true - SIN valid, false - SIN not valid).
   */
  @Column({
    name: "valid_sin",
    nullable: true,
  })
  isValidSIN?: boolean;
  /**
   * Request status code (e.g. 01 - SUCCESSFUL-REQUEST).
   */
  @Column({
    name: "request_status_code",
    nullable: true,
  })
  requestStatusCode?: string;
  /**
   * Match status code (e.g. 01 - SUCCESSFUL-MATCH).
   */
  @Column({
    name: "match_status_code",
    nullable: true,
  })
  matchStatusCode?: string;
  /**
   * SIN Match status code (e.g. 01 - SUCCESSFUL-MATCH).
   */
  @Column({
    name: "sin_match_status_code",
    nullable: true,
  })
  sinMatchStatusCode?: string;
  /**
   * Surname Match status code (e.g. 01 - SUCCESSFUL-MATCH).
   */
  @Column({
    name: "surname_match_status_code",
    nullable: true,
  })
  surnameMatchStatusCode?: string;
  /**
   * Given Name Match status code (e.g. 01 - SUCCESSFUL-MATCH).
   */
  @Column({
    name: "given_name_match_status_code",
    nullable: true,
  })
  givenNameMatchStatusCode?: string;
  /**
   * Dob Match status code (e.g. 01 - SUCCESSFUL-MATCH).
   */
  @Column({
    name: "dob_match_status_code",
    nullable: true,
  })
  birthDateMatchStatusCode?: string;
  /**
   * User id that requires a SIN validation.
   */
  @RelationId((sinValidation: SINValidation) => sinValidation.user)
  userId: number;
  /**
   * User that requires a SIN validation.
   */
  @ManyToOne(() => User, { eager: false, cascade: true, nullable: false })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;
}
