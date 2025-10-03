import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { ApplicationException } from "./application-exceptions.model";
import { ApplicationExceptionRequestStatus } from "@sims/sims-db/entities/application-exception-request-status.type";

export const EXCEPTION_NAME_MAX_LENGTH = 100;

/**
 * Represents the list of exceptions detected on a submitted full-time/part-time student
 * application, for instance, when a document needs to be reviewed.
 */
@Entity({ name: TableNames.ApplicationExceptionRequests })
export class ApplicationExceptionRequest extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Master record that group all exceptions detected on a submitted student application.
   */
  @ManyToOne(() => ApplicationException, {
    eager: false,
    cascade: false,
    nullable: false,
  })
  @JoinColumn({
    name: "application_exception_id",
    referencedColumnName: ColumnNames.ID,
  })
  applicationException: ApplicationException;
  /**
   * Unique identifier name of an application exception.
   */
  @Column({
    name: "exception_name",
    nullable: false,
    length: EXCEPTION_NAME_MAX_LENGTH,
  })
  exceptionName: string;
  /**
   * Description of the application exception. Critical for exceptions that
   * happens multiple times to allow its individual identification.
   */
  @Column({
    name: "exception_description",
  })
  exceptionDescription: string;
  /**
   * Reference to a previously approved exception request that was considered
   * to have the same content, which includes also associated files.
   */
  @ManyToOne(() => ApplicationExceptionRequest, {
    nullable: true,
  })
  @JoinColumn({
    name: "approval_exception_request_id",
    referencedColumnName: ColumnNames.ID,
  })
  approvalExceptionRequest?: ApplicationExceptionRequest;
  /**
   * Hash of the application exception data, which also include files
   * names and content hashes.
   */
  @Column({
    name: "exception_hash",
    type: "char",
    nullable: true,
  })
  exceptionHash?: string;

  /**
   * Status of the application exception request.
   */
  @Column({
    name: "exception_request_status",
    type: "enum",
    enum: ApplicationExceptionRequestStatus,
    enumName: "ApplicationExceptionRequestStatus",
    nullable: false,
  })
  exceptionRequestStatus: ApplicationExceptionRequestStatus;
}
