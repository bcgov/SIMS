import { IsEnum, IsNotEmpty, MaxLength } from "class-validator";
import {
  Note,
  NoteType,
  NOTE_DESCRIPTION_MAX_LENGTH,
  User,
} from "../../../database/entities";

/**
 * Base DTO for note.
 */
export class NoteAPIInDTO {
  @IsNotEmpty()
  @IsEnum(NoteType)
  noteType: string;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  description: string;
}

/**
 * Notes detail DTO. This is used for view only purpose.
 */
export class NoteAPIOutDTO {
  noteType: string;
  description: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

/**
 * Util to transform note entity model to DTO.
 * @param Entity
 * @returns notes
 */
export const transformToNoteDTO = (note: Note): NoteAPIOutDTO => {
  return {
    noteType: note.noteType,
    description: note.description,
    firstName: note.creator.firstName,
    lastName: note.creator.lastName,
    createdAt: note.createdAt,
  };
};

/**
 * Util to transform DTO to note entity model.
 * @param Entity
 * @returns notes
 */
export const transformToNoteEntity = (
  note: NoteAPIInDTO,
  userId: number,
): Note => {
  return {
    noteType: note.noteType,
    description: note.description,
    creator: { id: userId } as User,
  } as Note;
};
