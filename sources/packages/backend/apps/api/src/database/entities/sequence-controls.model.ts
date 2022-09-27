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

  /**
   * Current number for this sequence.
   * Even that the type on Postgres is a number(bigint), when loaded
   * it will still be parsed as a string even if the declaration of the type is a number.
   * Note about bigint type(from Typeorm docs): bigint column type, used in SQL databases,
   * doesn't fit into the regular number type and maps property to a string instead.
   */
  @Column({
    name: "sequence_number",
    type: "bigint",
    nullable: false,
  })
  sequenceNumber: string;
}
