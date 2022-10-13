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
}
