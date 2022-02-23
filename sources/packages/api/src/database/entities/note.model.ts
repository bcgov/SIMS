import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { NoteType } from ".";

/**
 * Entity for notes.
 */
@Entity({ name: TableNames.Notes })
export class Note extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Note type.
   */
  @Column({
    name: "note_type",
    type: "enum",
    enum: NoteType,
    enumName: "NoteType",
    nullable: false,
  })
  noteType: NoteType;
  /**
   * Description of the note.
   */
  @Column({
    name: "description",
    nullable: false,
  })
  description: string;
}
