import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StudentFile } from ".";
import { ColumnNames, TableNames } from "../constant";
import { Application } from "./application.model";
import { RecordDataModel } from "./record.model";

/**
 * Relationship table between students files and applications.
 * When uploaded in an application, an object with file info is created
 * inside the jsonb data on the column sims.applications.data.
 * This tables go further end keeps a database relationship to allow
 * the association with the student file.
 */
@Entity({ name: TableNames.ApplicationStudentFiles })
export class ApplicationStudentFile extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Application, (application) => application.studentFiles, {
    eager: false,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;

  @ManyToOne(() => StudentFile, {
    eager: false,
    cascade: ["update"],
  })
  @JoinColumn({
    name: "student_file_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentFile: StudentFile;
}
