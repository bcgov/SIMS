import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { RecordDataModel } from ".";

@Entity({ name: "sequence_controls" })
export class SequenceControl extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "sequence_name",
    nullable: false,
  })
  sequenceName: string;

  @Column({
    name: "sequence_number",
    nullable: false,
  })
  sequenceNumber: number;
}
