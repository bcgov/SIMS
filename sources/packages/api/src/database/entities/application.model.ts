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
  InstitutionLocation,
  MSFAANumber,
  OfferingIntensity,
  PIRDeniedReason,
  RelationshipStatus,
  SupportingUser,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { ApplicationStudentFile } from "./application-student-file.model";
import { ProgramInfoStatus } from "./program-info-status.type";
import { ApplicationStatus } from "./application-status.type";
import { RecordDataModel } from "./record.model";
import { Student } from "./student.model";
import { ProgramYear } from "./program-year.model";
import { StudentAssessment } from "./student-assessment.model";

@Entity({ name: TableNames.Applications })
export class Application extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Dynamic data entered by the student while answering the
   * questions to apply for a loan/grant. This is one of
   * the main inputs to execute the assessment workflow.
   */
  @Column({
    name: "data",
    type: "jsonb",
    nullable: false,
  })
  data: ApplicationData;
  /**
   * Application number generated once the application is submitted.
   * Draft applications will not have this number associated until
   * they are submitted.
   */
  @Column({
    name: "application_number",
  })
  applicationNumber: string;
  /**
   * Student id associated with this application.
   */
  @RelationId((application: Application) => application.student)
  studentId: number;
  /**
   * Student associated with this application.
   */
  @OneToOne(() => Student, { eager: false, cascade: false })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * References the location id related to the application
   * at the moment it was submitted by the student. See
   * further comments on the location property.
   */
  @RelationId((application: Application) => application.location)
  locationId: number;
  /**
   * References the location related to the application
   * at the moment it was submitted by the student.
   * For applications that do not have an offering
   * defined yet (need a PIR) this is the way to figure
   * out what location must be processing the PIR.
   * Once the PIR is finished and an offering in present
   * on the sims.student_assessments table the location
   * should be retrieved directly from the offering id.
   */
  @ManyToOne(() => InstitutionLocation, { eager: false, cascade: true })
  @JoinColumn({
    name: "location_id",
    referencedColumnName: ColumnNames.ID,
  })
  location: InstitutionLocation;
  /**
   * References the program related to the application
   * at the moment it was submitted by the student.
   * See further comments on the pirProgram property.
   */
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
    cascade: false,
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
    cascade: false,
  })
  @JoinColumn({
    name: "program_year_id",
    referencedColumnName: ColumnNames.ID,
  })
  programYear: ProgramYear;
  /**
   * Defines if the applications needs a PIR and keeps
   * the status of the PIR process.
   */
  @Column({
    name: "pir_status",
    type: "enum",
    enum: ProgramInfoStatus,
    enumName: "ProgramInfoStatus",
  })
  pirStatus: ProgramInfoStatus;
  /**
   * List of all files ids currently associated with the application.
   */
  @RelationId((application: Application) => application.studentFiles)
  studentFilesIds: number[];
  /**
   * List of all files currently associated with the application.
   */
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
  /**
   * Overall status of the application.
   */
  @Column({
    name: "application_status",
    type: "enum",
    enum: ApplicationStatus,
    enumName: "ApplicationStatus",
  })
  applicationStatus: ApplicationStatus;
  /**
   * Date and time that the status was updated.
   */
  @Column({
    name: "application_status_updated_on",
    nullable: false,
  })
  applicationStatusUpdatedOn: Date;
  /**
   * Reason id why a Program Information Request (PIR) was denied.
   */
  @RelationId((application: Application) => application.pirDeniedReasonId)
  pirDeniedId?: number;
  /**
   * Reason why a Program Information Request (PIR) was denied.
   */
  @ManyToOne(() => PIRDeniedReason, {
    eager: false,
    cascade: false,
  })
  @JoinColumn({
    name: "pir_denied_id",
    referencedColumnName: ColumnNames.ID,
  })
  pirDeniedReasonId?: PIRDeniedReason;
  /**
   * Other reason why a Program Information Request (PIR) was denied.
   */
  @Column({
    name: "pir_denied_other_desc",
  })
  pirDeniedOtherDesc?: string;
  /**
   * Relationship status given by the student in the application.
   * This will be the relationship considered to be used while
   * generating e-Cert files.
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
  /**
   * Id of the MSFAA (Master Student Financial Aid Agreement)
   * numbers generated for a student.
   */
  @RelationId((application: Application) => application.msfaaNumber)
  msfaaNumberId?: number;
  /**
   * MSFAA (Master Student Financial Aid Agreement)
   * numbers generated for a student.
   */
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
  studentAssessments?: StudentAssessment[];
  /**
   * Represents the assessment that holds the current information
   * for this application. The application could have many assessments
   * but only one should be considered as the 'current/active' at
   * one point in time.
   */
  @ManyToOne(() => StudentAssessment, {
    eager: false,
    cascade: ["update"],
    nullable: true,
  })
  @JoinColumn({
    name: "current_assessment_id",
    referencedColumnName: ColumnNames.ID,
  })
  currentAssessment?: StudentAssessment;
  /**
   * All supporting users related to the application.
   * These users (parents/partner) will be created as needed during
   * the execution of the original assessment workflow processing.
   */
  @OneToMany(
    () => SupportingUser,
    (supportingUser) => supportingUser.application,
    {
      eager: false,
      cascade: false,
      nullable: true,
    },
  )
  supportingUsers?: SupportingUser[];
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
