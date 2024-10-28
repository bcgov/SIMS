import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Note, User, Student } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

export const SIN_MAX_LENGTH = 9;

/**
 * SIN Validations that must be performed with ESDC.
 */
@Entity({ name: TableNames.SINValidations })
export class SINValidation extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Social insurance number.
   */
  @Column({
    name: "sin",
    nullable: false,
    length: SIN_MAX_LENGTH,
  })
  sin: string;
  /**
   * Date and time that the SIN validation file was generated
   * and sent.
   */
  @Column({
    name: "date_sent",
    type: "timestamptz",
    nullable: true,
  })
  dateSent?: Date;
  /**
   * Date and time that the received response file is processed for
   * SIN validation.
   */
  @Column({
    name: "date_received",
    type: "timestamptz",
    nullable: true,
  })
  dateReceived?: Date | null;
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
   * Date of birth sent in the file sent for SIN validation.
   */
  @Column({
    name: "dob_sent",
    type: "date",
    nullable: true,
  })
  dobSent?: string;
  /**
   * Gender sent in the file sent for SIN validation.
   */
  @Column({
    name: "gender_sent",
    nullable: true,
  })
  genderSent?: string;
  /**
   * SIN is validated or not(e.g. null - SIN record is not sent for validation, true - SIN valid, false - SIN not valid).
   */
  @Column({
    name: "valid_sin",
    nullable: true,
  })
  isValidSIN?: boolean;
  /**
   * Overall SIN validation status (e.g. 1-Passed, 2-Under Review, etc.)
   * returned on the ESDC response.
   */
  @Column({
    name: "sin_status",
    nullable: true,
  })
  sinStatus?: string;
  /**
   * Individual status of the SIN validation (Y/N) returned on the ESDC response.
   */
  @Column({
    name: "valid_sin_check",
    nullable: true,
  })
  validSINCheck?: string;
  /**
   * Individual status of birthdate validation (Y/N) returned on the ESDC response.
   */
  @Column({
    name: "valid_birthdate_check",
    nullable: true,
  })
  validBirthdateCheck?: string;
  /**
   * Individual status of the first name validation (Y/N) returned on the ESDC response.
   */
  @Column({
    name: "valid_first_name_check",
    nullable: true,
  })
  validFirstNameCheck?: string;
  /**
   * Individual status of the last name validation (Y/N) returned on the ESDC response.
   */
  @Column({
    name: "valid_last_name_check",
    nullable: true,
  })
  validLastNameCheck?: string;
  /**
   * Individual status of the gender validation (Y/N) returned on the ESDC response.
   */
  @Column({
    name: "valid_gender_check",
    nullable: true,
  })
  validGenderCheck?: string;
  /**
   * Defines if the SIN is temporary.
   * This column is automatically calculated on DB during
   * insert or update operations.
   */
  @Column({
    name: "temporary_sin",
    nullable: false,
    update: false,
    insert: false,
  })
  temporarySIN: boolean;
  /**
   * Expiration date for a temporary SIN.
   */
  @Column({
    name: "sin_expiry_date",
    type: "date",
    nullable: true,
  })
  sinExpiryDate?: string;
  /**
   * Student who requires a SIN validation.
   */
  @ManyToOne(() => Student, { eager: false, cascade: false, nullable: false })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * User that manually edited the SIN.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "sin_edited_by",
    referencedColumnName: ColumnNames.ID,
  })
  sinEditedBy?: User;
  /**
   * Date and time that a user manually edited the SIN.
   */
  @Column({
    name: "sin_edited_date",
    type: "timestamptz",
    nullable: true,
  })
  sinEditedDate?: Date;
  /**
   * Note that explains why the SIN was manually edited.
   */
  @OneToOne(() => Note, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "sin_edited_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  sinEditedNote?: Note;
  /**
   * User that manually edited the SIN expiry date.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "expiry_date_edited_by",
    referencedColumnName: ColumnNames.ID,
  })
  expiryDateEditedBy?: User;
  /**
   * Date and time that a user manually edited the SIN expiry date.
   */
  @Column({
    name: "expiry_date_edited_date",
    type: "timestamptz",
    nullable: true,
  })
  expiryDateEditedDate?: Date;
  /**
   * Note that explains why the SIN expiry date was manually edited.
   */
  @OneToOne(() => Note, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "expiry_date_edited_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  expiryDateEditedNote?: Note;
}
