import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * System Announcements.
 */
@Entity({ name: TableNames.Announcements })
export class Announcements extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Announcement title.
   */
  @Column({
    name: "message_title",
    nullable: false,
  })
  messageTitle: string;
  /**
   * Announcement content.
   */
  @Column({
    name: "message",
    nullable: false,
  })
  message: string;
  /**
   * Target areas for the announcement.
   */

  @Column("text", {
    name: "target",
    nullable: false,
    array: true,
  })
  target: string[];
  /**
   * Date when the announcement starts.
   */
  @Column({
    name: "start_date",
    type: "date",
    nullable: false,
  })
  startDate: Date;
  /**
   * Date when the announcement ends.
   */
  @Column({
    name: "end_date",
    type: "date",
    nullable: false,
  })
  endDate: Date;
}
