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
  OfferingIntensity,
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
import { Assessment, StudentAssessment } from "./student-assessment.model";

@Entity({ name: TableNames.Applications })
export class Application extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "data",
    type: "jsonb",
    nullable: false,
  })
  data: ApplicationData;

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
  /**
   * All assessments related to this application.
   * The first assessment will be created upon submission, so
   * draft applications do not have assessments associated with.
   */
  @OneToMany(
    () => StudentAssessment,
    (studentAssessment) => studentAssessment.application,
    {
      eager: false,
      cascade: true,
      nullable: true,
    },
  )
  studentAssessment?: StudentAssessment[];
}

/**
 * Represents the application dynamic data that in some way is used
 * by the API, hence not anymore dynamic and required to be present.
 * ! This is a subset of all possible properties that could be part
 * ! of the application data payload.
 */
export interface ApplicationData {
  /**
   * The workflow name is defined in the form data to allow, for instance,
   * different program years to call different assessment workflows.
   * For instance, the assessment workflow for the program year 2020/21
   * can be called assessment_v1 and the same for for 2021/22 can be called
   * assessment_v2.
   */
  workflowName: string;
  /**
   * While submitting a Student Application it is possible that the student
   * did not find the program in the list. In this situation the student will
   * provide the name that he would be looking for and the API need this value
   * to be returned sometimes before the PIR (Program Info Request) is completed.
   */
  programName?: string;
  /**
   * While submitting a Student Application it is possible that the student
   * did not find the program in the list. In this situation the student will
   * provide the description that he would be looking for and the API need this value
   * to be returned sometimes before the PIR (Program Info Request) is completed.
   */
  programDescription?: string;
  /**
   * Study start date provided by the student when the desired option was not found.
   */
  studystartDate?: string;
  /**
   * Study end date provided by the student when the desired option was not found.
   */
  studyendDate?: string;
  /**
   * Defines if the Student will take a full-time or part-time course.
   */
  howWillYouBeAttendingTheProgram?: OfferingIntensity;
  /**
   * Offering id selected by the student.
   */
  selectedOffering?: number;
  /**
   * Relationship status declared by the student.
   */
  relationshipStatus?: RelationshipStatus;
  /**
   * Student number.
   */
  studentNumber?: string;
  /**
   * Program id selected by the student.
   */
  selectedProgram?: number;
  /**
   * Location id selected by the student.
   */
  selectedLocation?: number;
}
