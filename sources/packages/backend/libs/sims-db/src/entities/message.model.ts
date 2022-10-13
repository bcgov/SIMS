import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

@Entity({
  name: TableNames.Messages,
})
export class Message extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Description of message.
   */
  @Column({
    name: "description",
    nullable: false,
  })
  description: string;
}
