import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Application, Note, User } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { ApplicationExceptionStatus } from "./application-exception-status.type";
import { ApplicationExceptionRequest } from "./application-exception-requests.model";

/**
 * Represents a set of exceptions detected on a submitted full-time/part-time student
 * application, for instance, when a document need to be reviewed.
 */
@Entity({ name: TableNames.ApplicationExceptions })
export class ApplicationException extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Submitted application with exceptions.
   */
  @OneToOne(() => Application, {
    eager: false,
    cascade: false,
    nullable: false,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
  /**
   * Current approval status of exceptions (e.g. Pending, Approved, Denied).
   */
  @Column({
    name: "exception_status",
    type: "enum",
    enum: ApplicationExceptionStatus,
    enumName: "ApplicationExceptionStatus",
    nullable: false,
  })
  exceptionStatus: ApplicationExceptionStatus;
  /**
   * Date that the Ministry approved or denied the exceptions.
   */
  @Column({
    name: "assessed_date",
    type: "timestamptz",
    nullable: true,
  })
  assessedDate?: Date;
  /**
   * Ministry user that approved or denied the exceptions.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "assessed_by",
    referencedColumnName: ColumnNames.ID,
  })
  assessedBy?: User;
  /**
   * Note added by the Ministry while approving or denying the exceptions.
   */
  @OneToOne(() => Note, { eager: false, cascade: true, nullable: true })
  @JoinColumn({
    name: "note_id",
    referencedColumnName: ColumnNames.ID,
  })
  exceptionNote?: Note;
  /**
   * List of all exceptions detected on a submitted student application.
   */
  @OneToMany(
    () => ApplicationExceptionRequest,
    (applicationExceptionRequest) =>
      applicationExceptionRequest.applicationException,
    {
      eager: false,
      cascade: ["insert"],
    },
  )
  exceptionRequests: ApplicationExceptionRequest[];
}
