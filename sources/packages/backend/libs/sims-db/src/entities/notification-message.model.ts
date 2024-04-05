import { Column, Entity, PrimaryColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

@Entity({
  name: TableNames.Messages,
})
export class NotificationMessage extends RecordDataModel {
  /**
   *  Primary key column.
   */
  @PrimaryColumn({
    name: "id",
    nullable: false,
  })
  id: number;
  /**
   * Description of notification message.
   */
  @Column({
    name: "description",
    nullable: false,
  })
  description: string;
  /**
   * Template id.
   */
  @Column({
    name: "template_id",
    nullable: false,
  })
  templateId: string;
  /**
   * Address to send the email notification.
   */
  @Column({
    name: "email_contacts",
    nullable: true,
    array: true,
    type: "varchar",
  })
  email_contacts?: string[];
}
