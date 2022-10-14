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
  @ManyToOne(() => User, { eager: false, cascade: false })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;
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
   * Notification Message type student file upload.
   */
  StudentFileUpload = 1,
  /**
   * Notification  Message type ministry file upload.
   */
  MinistryFileUpload = 2,
}
