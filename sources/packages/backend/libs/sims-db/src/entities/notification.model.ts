import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { NotificationMessage } from "./notification-message.model";
import { RecordDataModel } from "./record.model";
import { User } from "./user.model";

@Entity({
  name: TableNames.Notifications,
})
export class Notification extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * User associated with this notification.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: true })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user?: User;
  /**
   * Message notification payload.
   */
  @Column({
    name: "message_payload",
    type: "jsonb",
    nullable: false,
  })
  messagePayload: unknown;
  /**
   * Message associated with this notification.
   */
  @ManyToOne(() => NotificationMessage, { eager: false, cascade: false })
  @JoinColumn({
    name: "notification_message_id",
    referencedColumnName: ColumnNames.ID,
  })
  notificationMessage: NotificationMessage;
  /**
   * Date Sent Column
   */
  @Column({
    name: "date_sent",
    type: "timestamptz",
    nullable: true,
  })
  dateSent?: Date;
  /**
   * Date Read Column
   */
  @Column({
    name: "date_read",
    type: "timestamptz",
    nullable: true,
  })
  dateRead?: Date;
}

/**
 * Enumeration types for Notification Messages.
 */
export enum NotificationMessageType {
  /**
   * Student uploaded a file into his account.
   */
  StudentFileUpload = 1,
  /**
   * Ministry uploaded a file to the student account.
   */
  MinistryFileUpload = 2,
  /**
   * A new restriction was added to the student account.
   * Possible scenarios:
   * 1. Ministry places restriction on student account.
   * 2. System-generated restrictions on student account.
   * 3. Federal restriction placed on student account.
   */
  StudentRestrictionAdded = 3,
  /**
   * Ministry completes updating exception for an application.
   */
  MinistryCompletesException = 4,
  /**
   * Ministry completes updating a change requested by student.
   */
  MinistryCompletesChange = 5,
  /**
   * Institution reporting a change on application.
   */
  InstitutionReportsChange = 6,
  /**
   * Institution completes updating PIR.
   */
  InstitutionCompletesPIR = 7,
  /**
   * Institution confirms enrolment for an application.
   */
  InstitutionConfirmsCOE = 8,
}
