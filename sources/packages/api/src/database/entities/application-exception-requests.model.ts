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
}
