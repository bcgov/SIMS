import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { ApplicationStudentFile } from "./application-student-file.model";
import { ProgramInfoStatus } from "./program-info-status.type";
import { ApplicationStatus } from "./application-status.type";
import { RecordDataModel } from "./record.model";
import { Student } from "./student.model";

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

  @OneToOne(() => Student, { eager: false, cascade: true })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;

  @ManyToOne(() => InstitutionLocation, { eager: false, cascade: true })
  @JoinColumn({
    name: "location_id",
    referencedColumnName: ColumnNames.ID,
  })
  location: InstitutionLocation;

  /**
   * References the program related to the application.
   * For applications that do not have an offering
   * defined yet (need a PIR) this is the way to figure
   * out the related program.
   */
  @ManyToOne(() => EducationProgram, {
    eager: false,
    cascade: true,
  })
  @JoinColumn({
    name: "education_program_id",
    referencedColumnName: ColumnNames.ID,
  })
  program?: EducationProgram;

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

  @OneToMany(
    () => ApplicationStudentFile,
    (applicationStudentFile) => applicationStudentFile.application,
    {
      eager: false,
      cascade: true,
    },
  )
  studentFiles: ApplicationStudentFile[];

  @Column({
    name: "application_status",
    type: "enum",
  })
  applicationStatus: ApplicationStatus;
}
