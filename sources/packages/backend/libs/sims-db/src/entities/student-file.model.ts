import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { FileOriginType, StudentFileMetadata } from "./student-file.type";
import { Student } from "./student.model";
import { VirusScanStatus } from "./virus-scan-status-type";

export const FILE_NAME_MAX_LENGTH = 500;

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
    length: FILE_NAME_MAX_LENGTH,
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
   * File originated from, for instance, an Application
   * or Student uploader form. If it's Temporary, then
   * the file is uploaded but the file uploaded form is
   * not submitted yet. When the form is submitted, the
   * file origin is updated from Temporary to the
   * respective file_origin_type.
   */
  @Column({
    name: "file_origin",
    nullable: false,
    type: "enum",
    enum: FileOriginType,
    enumName: "FileOriginType",
  })
  fileOrigin: FileOriginType;
  /**
   * Metadata of the file, eg. if a file is uploaded
   * from student uploader form then the metadata may
   * sometimes have the application number related to
   * the application.
   */
  @Column({
    name: "metadata",
    type: "jsonb",
    nullable: true,
  })
  metadata?: StudentFileMetadata;
  /**
   * Virus scan status of the file.
   */
  @Column({
    name: "virus_scan_status",
    nullable: false,
    type: "enum",
    enum: VirusScanStatus,
    enumName: "VirusScanStatus",
  })
  virusScanStatus: VirusScanStatus;
  /**
   * Date and time when the virus scan status of the file was updated.
   */
  @Column({
    name: "virus_scan_status_updated_on",
    type: "timestamptz",
    nullable: false,
  })
  virusScanStatusUpdatedOn: Date;
}
