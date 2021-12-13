import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Application, OfferingIntensity, Student } from ".";
import { ColumnNames, TableNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";
import { RecordDataModel } from "./record.model";

/**
 * Keep track of the MSFAA (Master Student Financial Aid Agreement)
 * numbers generated for a student.
 */
@Entity({ name: TableNames.MSFAANumbers })
export class MSFAANumber extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Unique generated number to be sent to ESDC to identify the MSFAA.
   * Even that the type on Postgres is a number(bigint), when loaded
   * it will still be parsed as a string even if the declaration of the type is a number.
   * Note about bigint type(from Typeorm docs): bigint column type, used in SQL databases,
   * doesn't fit into the regular number type and maps property to a string instead.
   */
  @Column({
    name: "msfaa_number",
    type: "bigint",
  })
  msfaaNumber: string;
  /**
   * Date with timezone that the request was generated to ESDC.
   * When null, it indicates that the request was not sent yet.
   * This column does not contains time information, so the time
   * of this field must be reconsidered on any calculation.
   */
  @Column({
    name: "date_requested",
  })
  dateRequested?: Date;
  /**
   * Date that the student signed the MSFAA. If null,
   * the response was not returned from ESDC yet or
   * the student did not signed the agreement yet.
   * This column does not contains time information, so the time
   * of this field must be reconsidered on any calculation.
   */
  @Column({
    name: "date_signed",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: true,
  })
  dateSigned?: Date;
  /**
   * Date that the service provider received the signed student MSFAA.
   * This column does not contains time information, so the time
   * of this field must be reconsidered on any calculation.
   */
  @Column({
    name: "service_provider_received_date",
    type: "date",
    transformer: dateOnlyTransformer,
    nullable: true,
  })
  serviceProviderReceivedDate?: Date;
  /**
   * Offering Intensity of the reference application.
   */
  @Column({
    name: "offering_intensity",
    nullable: false,
  })
  offeringIntensity: OfferingIntensity;
  /**
   * Cancelled date of the MSFAA Number.
   */
  @Column({
    name: "cancelled_date",
    nullable: true,
  })
  cancelledDate?: Date;
  /**
   * Province which issued the new MSFAA number.
   */
  @Column({
    name: "new_issuing_province",
    nullable: true,
  })
  newIssuingProvince?: string;
  /**
   * Student id related to this MSFAA.
   */
  @RelationId((msfaaNumber: MSFAANumber) => msfaaNumber.student)
  studentId: number;
  /**
   * Student related to this MSFAA.
   */
  @ManyToOne(() => Student, { eager: false, cascade: true })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * Application that creates the MSFAA Number.
   */
  @ManyToOne(() => Application, { eager: false, cascade: false })
  @JoinColumn({
    name: "reference_application_id",
    referencedColumnName: ColumnNames.ID,
  })
  referenceApplication: Application;
}
