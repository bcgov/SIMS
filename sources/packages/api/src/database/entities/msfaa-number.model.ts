import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Student } from ".";
import { ColumnNames, TableNames } from "../constant";
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
   * This number has a maximum value of 9,999,999,999 so, even being a
   * bigint in database, it still can be mapped to a javascript number.
   */
  @Column({
    name: "msfaa_number",
    type: "bigint",
  })
  msfaaNumber: number;
  /**
   * Date that the request was generated to ESDC.
   * When null, it indicates that the request was not sent yet.
   * This colum does not contains time information, so the time
   * of this field must be reconsidered on any calculation.
   */
  @Column({
    name: "date_requested",
    type: "date",
  })
  dateRequested?: Date;
  /**
   * Date that the student signed the MSFAA. If null,
   * the response was not returned from ESDC yet or
   * the student did not signed the agreement yet.
   * This colum does not contains time information, so the time
   * of this field must be reconsidered on any calculation.
   */
  @Column({
    name: "date_signed",
    type: "date",
  })
  dateSigned?: Date;
  /**
   * Date that the service provider received the signed student MSFAA.
   * This colum does not contains time information, so the time
   * of this field must be reconsidered on any calculation.
   */
  @Column({
    name: "service_provider_received_date",
    type: "date",
  })
  serviceProviderReceivedDate?: Date;
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
}
