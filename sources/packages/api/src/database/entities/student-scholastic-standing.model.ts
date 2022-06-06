import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Application, Note, StudentAssessment, User } from ".";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * Represents a scholastic standing change requested by the Institution due to some
 * change in the student situation for a particular Student Application.
 */
@Entity({ name: TableNames.StudentScholasticStandings })
export class StudentScholasticStanding extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Application id related to this scholastic standing change.
   */
  @RelationId(
    (studentAssessment: StudentScholasticStanding) =>
      studentAssessment.application,
  )
  applicationId: number;
  /**
   * Application related to this scholastic standing change.
   */
  @ManyToOne(() => Application, {
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
   * Dynamic form data that represents the scholastic standing change requested
   * by the Institution. This data is intended be consumed by the workflow.
   */
  @Column({
    name: "submitted_data",
    type: "jsonb",
    nullable: false,
  })
  submittedData: any;
  /**
   * Date that the Institution user submitted the scholastic standing.
   */
  @Column({
    name: "submitted_date",
    type: "timestamptz",
    nullable: false,
  })
  submittedDate: Date;
  /**
   * Institution user that submitted the scholastic standing.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: false })
  @JoinColumn({
    name: "submitted_by",
    referencedColumnName: ColumnNames.ID,
  })
  submittedBy: User;
  /**
   * Note added by the Ministry while approving or denying the scholastic standing.
   */
  @OneToOne(() => Note, { eager: false, cascade: true, nullable: true })
  @JoinColumn({
    name: "note_id",
    referencedColumnName: ColumnNames.ID,
  })
  note?: Note;
  /**
   * Student assessment associated with this student scholastic standing.
   */
  @OneToOne(
    () => StudentAssessment,
    (studentAssessment) => studentAssessment.studentScholasticStanding,
    {
      eager: false,
      cascade: ["insert", "update"],
      nullable: true,
    },
  )
  studentAssessment?: StudentAssessment;
}
