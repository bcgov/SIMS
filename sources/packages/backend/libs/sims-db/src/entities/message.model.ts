import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { RecordDataModel } from "./record.model";

@Entity({
  name: "messages",
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
