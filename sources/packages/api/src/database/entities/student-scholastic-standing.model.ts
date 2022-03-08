import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Application, Note, ScholasticStandingStatus, User } from ".";
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
   * Dynamic form data that represents the final data revised by the Ministry.
   */
  @Column({
    name: "approved_data",
    type: "jsonb",
    nullable: true,
  })
  approvedData?: any;
  /**
   * Status of the current request [Pending, Approved, Denied].
   */
  @Column({
    name: "scholastic_standing_status",
    type: "enum",
    enum: ScholasticStandingStatus,
    enumName: "ScholasticStandingStatus",
    nullable: false,
  })
  scholasticStandingStatus: ScholasticStandingStatus;
  /**
   * Date that the Ministry approved or denied the scholastic standing.
   */
  @Column({
    name: "assessed_date",
    type: "timestamptz",
    nullable: true,
  })
  assessedDate?: Date;
  /**
   * Ministry user that approved or declined the scholastic standing.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "assessed_by",
    referencedColumnName: ColumnNames.ID,
  })
  assessedBy?: User;
  /**
   * Note added by the Ministry while approving or denying the scholastic standing.
   */
  @OneToOne(() => Note, { eager: false, cascade: true, nullable: true })
  @JoinColumn({
    name: "note_id",
    referencedColumnName: ColumnNames.ID,
  })
  note?: Note;
}
