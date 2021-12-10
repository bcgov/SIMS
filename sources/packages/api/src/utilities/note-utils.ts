import {
  NoteDTO,
  NoteBaseDTO,
} from "../route-controllers/note/models/note.dto";
import { Note, User } from "../database/entities";

/**
 * Util to transform note entity model to DTO.
 * @param Entity
 * @returns NoteDTO
 */
export const transformToNoteDTO = (note: Note): NoteDTO => {
  return {
    noteType: note.noteType,
    description: note.description,
    firstName: note.creator.firstName,
    lastName: note.creator.lastName,
    createdAt: note.createdAt,
  };
};

/**
 * Util to transform note entity model to DTO.
 * @param Entity
 * @returns NoteDTO
 */
export const transformToNoteEntity = (
  note: NoteBaseDTO,
  userId: number,
): Note => {
  return {
    noteType: note.noteType,
    description: note.description,
    creator: { id: userId } as User,
  } as Note;
};
