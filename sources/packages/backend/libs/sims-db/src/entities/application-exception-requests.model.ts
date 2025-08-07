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
   * Index used for exceptions that can happen multiple times, for instance,
   * dependents lists or parents list.
   */
  @Column({
    name: "exception_index",
    type: "smallint",
    nullable: true,
  })
  exceptionIndex?: number;
  /**
   * Description of the application exception. Critical for exceptions that
   * happens multiple times to allow its individual identification.
   */
  @Column({
    name: "exception_description",
    nullable: true,
  })
  exceptionDescription?: string;
  /**
   * Reference to a previously approved exception request that was considered
   * to have the same content, which includes also associated files.
   */
  @ManyToOne(() => ApplicationExceptionRequest, {
    cascade: ["update"],
    nullable: true,
  })
  @JoinColumn({
    name: "approval_exception_id",
    referencedColumnName: ColumnNames.ID,
  })
  approvalException?: ApplicationExceptionRequest;
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
}
