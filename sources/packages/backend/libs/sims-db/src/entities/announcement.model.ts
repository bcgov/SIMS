import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
/**
 * System Announcements.
 */
@Entity({ name: TableNames.Announcements })
export class Announcement {
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
    type: "timestamptz",
    nullable: false,
  })
  startDate: Date;
  /**
   * Date when the announcement ends.
   */
  @Column({
    name: "end_date",
    type: "timestamptz",
    nullable: false,
  })
  endDate: Date;
}
