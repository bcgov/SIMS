import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StudentFile } from ".";
import { ColumnNames, TableNames } from "../constant";
import { Application } from "./application.model";
import { RecordDataModel } from "./record.model";

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
  })
  @JoinColumn({
    name: "student_file_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentFile: StudentFile;
}
