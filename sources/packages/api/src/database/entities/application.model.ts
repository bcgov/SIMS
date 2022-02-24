import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import {
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
  MSFAANumber,
  PIRDeniedReason,
  RelationshipStatus,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { ApplicationStudentFile } from "./application-student-file.model";
import { ProgramInfoStatus } from "./program-info-status.type";
import { ApplicationStatus } from "./application-status.type";
import { AssessmentStatus } from "./assessment-status.type";
import { RecordDataModel } from "./record.model";
import { Student } from "./student.model";
import { ProgramYear } from "./program-year.model";
import { DisbursementSchedule } from "./disbursement-schedule.model";

@Entity({ name: TableNames.Applications })
export class Application extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "data",
    type: "jsonb",
    nullable: false,
  })
  data: any;

  @Column({
    name: "application_number",
  })
  applicationNumber: string;

  @Column({
    name: "assessment",
    type: "jsonb",
    nullable: true,
  })
  assessment: Assessment;

  @RelationId((application: Application) => application.student)
  studentId: number;

  @OneToOne(() => Student, { eager: false, cascade: true })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;

  @RelationId((application: Application) => application.location)
  locationId: number;

  @ManyToOne(() => InstitutionLocation, { eager: false, cascade: true })
  @JoinColumn({
    name: "location_id",
    referencedColumnName: ColumnNames.ID,
  })
  location: InstitutionLocation;

  @RelationId((application: Application) => application.pirProgram)
  pirProgramId?: number;

  /**
   * References the program related to the application
   * at the moment it was submitted by the student.
   * For applications that do not have an offering
   * defined yet (need a PIR) this is the way to figure
   * out the related program.
   */
  @ManyToOne(() => EducationProgram, {
    eager: false,
    cascade: true,
  })
  @JoinColumn({
    name: "pir_education_program_id",
    referencedColumnName: ColumnNames.ID,
  })
  pirProgram?: EducationProgram;

  @RelationId((application: Application) => application.programYear)
  programYearId: number;

  /**
   * References the program year related to the application.
   * This will be populated only when an active program year application is Submitted
   */
  @ManyToOne(() => ProgramYear, {
    eager: false,
    cascade: true,
  })
  @JoinColumn({
    name: "program_year_id",
    referencedColumnName: ColumnNames.ID,
  })
  programYear: ProgramYear;

  @RelationId((application: Application) => application.offering)
  offeringId?: number;

  @ManyToOne(() => EducationProgramOffering, {
    eager: false,
    cascade: true,
  })
  @JoinColumn({
    name: "offering_id",
    referencedColumnName: ColumnNames.ID,
  })
  offering?: EducationProgramOffering;

  @Column({
    name: "pir_status",
    type: "enum",
    enum: ProgramInfoStatus,
    enumName: "ProgramInfoStatus",
  })
  pirStatus: ProgramInfoStatus;

  @Column({
    name: "assessment_workflow_id",
    type: "uuid",
  })
  assessmentWorkflowId: string;

  @RelationId((application: Application) => application.studentFiles)
  studentFilesIds: number[];

  @OneToMany(
    () => ApplicationStudentFile,
    (applicationStudentFile) => applicationStudentFile.application,
    {
      eager: false,
      cascade: true,
      onDelete: "CASCADE",
    },
  )
  studentFiles: ApplicationStudentFile[];

  @Column({
    name: "application_status",
    type: "enum",
    enum: ApplicationStatus,
    enumName: "ApplicationStatus",
  })
  applicationStatus: ApplicationStatus;

  @Column({
    name: "assessment_status",
    type: "enum",
    enum: AssessmentStatus,
    enumName: "AssessmentStatus",
  })
  assessmentStatus: AssessmentStatus;

  @Column({
    name: "application_status_updated_on",
    nullable: false,
  })
  applicationStatusUpdatedOn: Date;

  @RelationId((application: Application) => application.pirDeniedReasonId)
  pirDeniedId?: number;

  @ManyToOne(() => PIRDeniedReason, {
    eager: false,
    cascade: false,
  })
  @JoinColumn({
    name: "pir_denied_id",
    referencedColumnName: ColumnNames.ID,
  })
  pirDeniedReasonId?: PIRDeniedReason;

  @Column({
    name: "pir_denied_other_desc",
  })
  pirDeniedOtherDesc?: string;

  /**
   * Relationship status given by the student in the application.
   */
  @Column({
    name: "relationship_status",
    nullable: true,
  })
  relationshipStatus?: RelationshipStatus;

  /**
   * Student number given by the student in the application.
   */
  @Column({
    name: "student_number",
    nullable: true,
  })
  studentNumber?: string;

  @RelationId((application: Application) => application.msfaaNumber)
  msfaaNumberId?: number;

  @ManyToOne(() => MSFAANumber, {
    eager: false,
    cascade: true,
  })
  @JoinColumn({
    name: "msfaa_number_id",
    referencedColumnName: ColumnNames.ID,
  })
  msfaaNumber?: MSFAANumber;

  /**
   * Disbursement ids related to this application.
   */
  @RelationId((application: Application) => application.disbursementSchedules)
  disbursementSchedulesIds?: number[];
  /**
   * Disbursements related to this application.
   */
  @OneToMany(
    () => DisbursementSchedule,
    (disbursementSchedule) => disbursementSchedule.application,
    {
      eager: false,
      cascade: true,
      onDelete: "CASCADE",
      nullable: true,
    },
  )
  disbursementSchedules?: DisbursementSchedule[];
}

/**
 * Interface for BaseAssessment values that are shared between FullTime and PartTime
 */
export interface BaseAssessment {
  weeks: number;
  tuitionCost: number;
  childcareCost: number;
  transportationCost: number;
  booksAndSuppliesCost: number;
  totalFederalAward: number;
  totalProvincialAward: number;
  totalFamilyIncome: number;
  totalAssessmentNeed: number;
}
/**
 * Interface for FullTime assessment payload.
 */
export interface FullTimeAssessment extends BaseAssessment {
  federalAssessmentNeed: number;
  provincialAssessmentNeed: number;
  exceptionalEducationCost: number;
  livingAllowance: number;
  alimonyOrChildSupport: number;
  secondResidenceCost: number;
  partnerStudentLoanCost: number;
  totalAssessedCost: number;
  studentTotalFederalContribution: number;
  studentTotalProvincialContribution: number;
  partnerAssessedContribution: number;
  parentAssessedContribution: number;
  totalFederalContribution: number;
  totalProvincialContribution: number;
  otherAllowableCost: number;
}

/**
 * Interface for PartTime assessment payload.
 */
export interface PartTimeAssessment extends BaseAssessment {
  miscellaneousCost: number;
  totalAcademicExpenses: number;
}
/**
 * This is a type which provides the contract for FullTime and PartTime assessment payload
 * which is stored to database by workflow.
 * It is possible that more properties can be added to the assessment payload
 * without updating this interface and displayed in NOA form.
 * Whenever there is a source code update, please ensure that properties in this interface are in sync with
 * assessment payload created by camunda workflow.
 */
export type Assessment = FullTimeAssessment | PartTimeAssessment;
