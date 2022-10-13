import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
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
  @OneToOne(() => User, { eager: false, cascade: false })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: ColumnNames.ID,
  })
  user: User;
  /**
   * Template id.
   */
  @Column({
    name: "template_id",
    nullable: false,
  })
  templateId: string;
  /**
   * GC notification payload.
   */
  @Column({
    name: "gc_notify_payload",
    type: "jsonb",
    nullable: false,
  })
  messagePayload: unknown;
  /**
   * Message associated with this notification.
   */
  @OneToOne(() => NotificationMessage, { eager: false, cascade: false })
  @JoinColumn({
    name: "message_id",
    referencedColumnName: ColumnNames.ID,
  })
  message: NotificationMessage;
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
