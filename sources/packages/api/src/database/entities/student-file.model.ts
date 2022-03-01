import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { FileOriginType } from "./student-file.type";
import { Student } from "./student.model";

/**
 * Stores files information and content from any
 * uploaded file related to a student.
 */
@Entity({ name: TableNames.StudentsFiles })
export class StudentFile extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Friendly file name that will be displayed to the user.
   */
  @Column({
    name: "file_name",
  })
  fileName: string;
  /**
   * Unique file name (name+guid) to be used internally.
   */
  @Column({
    name: "unique_file_name",
  })
  uniqueFileName: string;
  /**
   * Any grouping name (or tag) that could provide
   * a meaning to a file or group of files.
   */
  @Column({
    name: "group_name",
  })
  groupName: string;
  /**
   * File MIME type.
   */
  @Column({
    name: "mime_type",
  })
  mimeType: string;
  /**
   * File bytes.
   */
  @Column({
    name: "file_content",
    type: "bytea",
  })
  fileContent: Buffer;
  /**
   * Student associated with this file.
   */
  @OneToOne(() => Student, { eager: false, cascade: true })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * File original originated from like Application or
   * Student uploader form. If its Temporary, then the
   * file is uploaded but the file uploaded form is not
   * submitted, when the form is submitted, the file
   * origin is updated from Temporary to the respective
   * file_origin_type;
   */
  @Column({
    name: "file_origin",
    nullable: false,
  })
  fileOrigin: FileOriginType;
  /**
   * 'Metadata of the file, eg. if a file is uploaded
   * from student uploader form then the metadata may
   * sometimes have the application number related to
   * the application.
   */
  @Column({
    name: "metadata",
    type: "jsonb",
    nullable: true,
  })
  metadata?: string;
}
