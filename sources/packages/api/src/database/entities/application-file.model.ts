import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { Application } from "./application.model";
import { RecordDataModel } from "./record.model";
import { Student } from "./student.model";

@Entity({ name: TableNames.ApplicationsFiles })
export class ApplicationFile extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "file_name",
  })
  fileName: string;

  @Column({
    name: "unique_file_name",
  })
  uniqueFileName: string;

  @Column({
    name: "group_name",
  })
  groupName: string;

  @Column({
    name: "mime_type",
  })
  mimeType: string;

  @Column({
    name: "file_content",
    type: "bytea",
  })
  fileContent: Buffer;

  @OneToOne(() => Application, { eager: false, cascade: true })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;

  @OneToOne(() => Student, { eager: false, cascade: true })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
}
