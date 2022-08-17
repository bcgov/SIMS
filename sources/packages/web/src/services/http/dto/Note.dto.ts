import { StudentNoteType } from "@/types";

/**
 * Base DTO for note.
 */
export interface NoteAPIInDTO {
  noteType: StudentNoteType;
  description: string;
}

/**
 * Notes detail DTO. This is used for view only purpose.
 */
export interface NoteAPIOutDTO {
  noteType: StudentNoteType;
  description: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}
