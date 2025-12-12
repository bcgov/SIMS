import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import {
  RecordDataModel,
  User,
  ContactInfo,
  Note,
  DisabilityStatus,
  StudentRestriction,
  CASSupplier,
  DisbursementOveraward,
  Application,
  SFASIndividual,
  StudentAppealRequest,
  ModifiedIndependentStatus,
  SINValidation,
} from ".";

@Entity({ name: TableNames.Student })
export class Student extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "contact_info",
    type: "jsonb",
    nullable: false,
  })
  contactInfo: ContactInfo;

  @Column({
    name: "birth_date",
    type: "date",
  })
  birthDate: string;

  @Column({
    name: "gender",
  })
  gender: string;

  @OneToOne(() => User, { eager: true, cascade: true })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;

  @Column({
    name: "pd_date_sent",
    nullable: true,
  })
  studentPDSentAt?: Date;

  @Column({
    name: "pd_date_update",
    nullable: true,
  })
  studentPDUpdateAt?: Date;

  @ManyToMany(() => Note, { eager: false, cascade: true })
  @JoinTable({
    name: TableNames.StudentNotes,
    joinColumn: { name: ColumnNames.StudentId },
    inverseJoinColumn: { name: ColumnNames.NoteId },
  })
  notes: Note[];

  /**
   * Current SIN validation associated with the student.
   */
  @OneToOne(() => SINValidation, { eager: false, cascade: true })
  @JoinColumn({
    name: "sin_validation_id",
    referencedColumnName: ColumnNames.ID,
  })
  sinValidation: SINValidation;

  /**
   * SIN validations complete history.
   */
  @OneToMany(() => SINValidation, (sinValidation) => sinValidation.student)
  sinValidations: SINValidation[];

  /**
   * Indicates consent of the student to terms and conditions of the studentAid BC declaration of SIN.
   */
  @Column({
    name: "sin_consent",
  })
  sinConsent: boolean;

  /**
   * List of all student restrictions.
   */
  @OneToMany(
    () => StudentRestriction,
    (studentRestriction) => studentRestriction.student,
    {
      eager: false,
      cascade: false,
    },
  )
  studentRestrictions?: StudentRestriction[];

  /**
   * Disability status of the student.
   */
  @Column({
    name: "disability_status",
    type: "enum",
    enum: DisabilityStatus,
    enumName: "DisabilityStatus",
  })
  disabilityStatus: DisabilityStatus;

  /**
   * Disability status effective date.
   */
  @Column({
    name: "disability_status_effective_date",
    type: "timestamptz",
    nullable: true,
  })
  disabilityStatusEffectiveDate?: Date;

  /**
   * Student supplier information data from the integration with Corporate Accounting System (CAS).
   */
  @OneToOne(() => CASSupplier, {
    eager: false,
    cascade: ["insert", "update"],
    nullable: true,
  })
  @JoinColumn({
    name: "cas_supplier_id",
    referencedColumnName: ColumnNames.ID,
  })
  casSupplier?: CASSupplier;

  /**
   * Student overawards.
   */
  @OneToMany(() => DisbursementOveraward, (overaward) => overaward.student, {
    eager: false,
    cascade: false,
  })
  overawards?: DisbursementOveraward[];

  /**
   * Student applications.
   */
  @OneToMany(() => Application, (application) => application.student, {
    eager: false,
    cascade: false,
  })
  applications?: Application[];

  /**
   * Legacy student profile.
   * The student can potentially be associated with multiple legacy profiles,
   * but only one is currently supported.
   */
  @OneToMany(() => SFASIndividual, (sfasIndividual) => sfasIndividual.student, {
    nullable: true,
  })
  sfasIndividuals?: SFASIndividual[];

  /**
   * Status of the modified independent associated to the student.
   */
  @Column({
    name: "modified_independent_status",
    type: "enum",
    enum: ModifiedIndependentStatus,
    enumName: "ModifiedIndependentStatus",
  })
  modifiedIndependentStatus: ModifiedIndependentStatus;

  /**
   * Reference to the appeal request ID if the student has requested an appeal
   * for the modified independent status.
   */
  @OneToOne(() => StudentAppealRequest, {
    nullable: true,
  })
  @JoinColumn({
    name: "modified_independent_appeal_request_id",
    referencedColumnName: ColumnNames.ID,
  })
  modifiedIndependentAppealRequest?: StudentAppealRequest;

  /**
   * User who updated the modified independent status.
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: "modified_independent_status_updated_by",
    referencedColumnName: ColumnNames.ID,
  })
  modifiedIndependentStatusUpdatedBy?: User;

  /**
   * Date and time when the modified independent status was updated.
   */
  @Column({
    name: "modified_independent_status_updated_on",
    type: "timestamptz",
    nullable: true,
  })
  modifiedIndependentStatusUpdatedOn?: Date;
}
