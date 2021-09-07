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
  PIRDeniedReason,
  COEDeniedReason,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { ApplicationStudentFile } from "./application-student-file.model";
import { ProgramInfoStatus } from "./program-info-status.type";
import { ApplicationStatus } from "./application-status.type";
import { AssessmentStatus } from "./assessment-status.type";
import { COEStatus } from "./coe-status.type";
import { RecordDataModel } from "./record.model";
import { Student } from "./student.model";
import { ProgramYear } from "./program-year.model";

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
  assessment: any;

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
  })
  applicationStatus: ApplicationStatus;

  @Column({
    name: "assessment_status",
    type: "enum",
  })
  assessmentStatus: AssessmentStatus;

  @Column({
    name: "coe_status",
    type: "enum",
  })
  coeStatus: COEStatus;

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
  pirDeniedOtherDesc: string;

  @RelationId((application: Application) => application.coeDeniedReason)
  coeDeniedId?: number;

  @ManyToOne(() => COEDeniedReason, {
    eager: false,
    cascade: false,
  })
  @JoinColumn({
    name: "coe_denied_id",
    referencedColumnName: ColumnNames.ID,
  })
  coeDeniedReason?: COEDeniedReason;

  @Column({
    name: "coe_denied_other_desc",
  })
  coeDeniedOtherDesc: string;
}
