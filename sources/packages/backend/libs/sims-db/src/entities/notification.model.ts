import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { User } from "./user.model";

@Entity({
  name: "notifications",
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
    nullable: false,
  })
  gcNotifyPayload: string;
}
