import {
  ArrayMaxSize,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from "class-validator";
import { Note, NoteType, NOTE_DESCRIPTION_MAX_LENGTH } from "@sims/sims-db";
import { getUserFullName } from "../../../utilities";
import { Transform } from "class-transformer";

/**
 * Base DTO for note.
 */
export class NoteAPIInDTO {
  @IsEnum(NoteType)
  noteType: NoteType;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  description: string;
}

/**
 * Notes detail DTO. This is used for view only purpose.
 */
export class NoteAPIOutDTO {
  id: number;
  noteType: NoteType;
  description: string;
  createdBy: string;
  createdAt: Date;
}

/**
 * Util to transform note entity model to DTO.
 * @param note
 * @returns notes
 */
export const transformToNoteDTO = (note: Note): NoteAPIOutDTO => {
  return {
    id: note.id,
    noteType: note.noteType,
    description: note.description,
    createdBy: getUserFullName(note.creator),
    createdAt: note.createdAt,
  };
};

/**
 * Query string for filtering notes by note types.
 * In no note types are provided, all notes will be returned.
 */
export class NoteAPIQueryStringApiInDTO {
  @IsOptional()
  @ArrayMaxSize(Object.keys(NoteType).length)
  @Transform(({ value }) => value.split(","))
  @IsEnum(NoteType, { each: true })
  noteTypes?: NoteType[];
}
