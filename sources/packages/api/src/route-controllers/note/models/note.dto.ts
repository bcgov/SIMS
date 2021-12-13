/**
 * Base DTO for note.
 */
export interface NoteBaseDTO {
  noteType: string;
  description: string;
}

/**
 * Notes detail DTO. This is used for view only purpose.
 */
export interface NoteDTO extends NoteBaseDTO {
  firstName: string;
  lastName: string;
  createdAt: Date;
}
