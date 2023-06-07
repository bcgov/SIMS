import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  RelationId,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { Application } from "./application.model";
import { EducationProgramOffering } from "./education-program-offering.model";
import { User } from "./user.model";
import { Note } from "./note.model";
import { ApplicationOfferingChangeRequestStatus } from "./application-offering-change-request-status.type";

const REASON_MAX_LENGTH = 500;
/**
 * Represents the list of application specific offering change request,
 * which is requested by institution.
 */
@Entity({ name: TableNames.ApplicationOfferingChangeRequests })
export class ApplicationOfferingChangeRequest extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */

  @PrimaryColumn({
    name: "id",
    nullable: false,
  })
  id: number;

  /**
   * Student Application id related to application specific offering change request.
   */
  @RelationId(
    (applicationOfferingChangeRequest: ApplicationOfferingChangeRequest) =>
      applicationOfferingChangeRequest.application,
  )
  applicationId: number;
  /**
   * Student Application on which the application specific offering change was requested.
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
   * The new offering id created by the institution for the application specific offering change.
   */
  @RelationId(
    (applicationOfferingChangeRequest: ApplicationOfferingChangeRequest) =>
      applicationOfferingChangeRequest.requestedOffering,
  )
  requestedOfferingId: number;
  /**
   * The new or existing offering assigned by the institution for the application specific offering change.
   */
  @ManyToOne(() => EducationProgramOffering, {
    eager: false,
    cascade: false,
    nullable: false,
  })
  @JoinColumn({
    name: "requested_offering_id",
    referencedColumnName: ColumnNames.ID,
  })
  requestedOffering: EducationProgramOffering;

  /**
   * The actual offering id that where requested for the application specific offering change by the institution.
   */
  @RelationId(
    (applicationOfferingChangeRequest: ApplicationOfferingChangeRequest) =>
      applicationOfferingChangeRequest.activeOffering,
  )
  activeOfferingId: number;
  /**
   *The actual offering that where requested for the application specific offering change by the institution.
   */
  @ManyToOne(() => EducationProgramOffering, {
    eager: false,
    cascade: false,
    nullable: false,
  })
  @JoinColumn({
    name: "active_offering_id",
    referencedColumnName: ColumnNames.ID,
  })
  activeOffering: EducationProgramOffering;

  /**
   * Current status of application specific offering request change (e.g. In progress with the student,
   * In progress with SABC, Approved, Declined by student, Declined by SABC).
   */
  @Column({
    name: "application_offering_change_request_status",
    type: "enum",
    enum: ApplicationOfferingChangeRequestStatus,
    enumName: "ApplicationOfferingChangeRequestStatus",
  })
  applicationOfferingChangeRequestsStatus: ApplicationOfferingChangeRequestStatus;

  /**
   * Date that the Ministry approved or denied the application specific offering request change.
   */
  @Column({
    name: "assessed_date",
    type: "timestamptz",
    nullable: true,
  })
  assessedDate?: Date;

  /**
   * Ministry user that approved or denied the application specific offering request change.
   */
  @ManyToOne(() => User, { eager: false, cascade: false })
  @JoinColumn({
    name: "assessed_by",
    referencedColumnName: ColumnNames.ID,
  })
  assessedBy?: User;

  /**
   * Date that the Student approved or denied the application specific offering request change.
   */
  @Column({
    name: "student_action_date",
    type: "timestamptz",
    nullable: true,
  })
  studentActionDate?: Date;

  /**
   * The reason for application specific offering request change added by institution.
   */
  @Column({
    name: "reason",
    length: REASON_MAX_LENGTH,
  })
  reason: string;

  /**
   * Note added by the Ministry while approving or denying the application
   * specific offering request change.
   */
  @OneToOne(() => Note, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "assessed_note_id",
    referencedColumnName: ColumnNames.ID,
  })
  assessedNote?: Note;
}
