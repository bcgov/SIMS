/**
 * Base DTO for note.
 */
export interface NoteBaseAPIInDTO {
  noteType: string;
  description: string;
}

/**
 * Notes detail DTO. This is used for view only purpose.
 */
export interface NoteAPIOutDTO extends NoteBaseAPIInDTO {
  firstName: string;
  lastName: string;
  createdAt: Date;
  showMore?: boolean;
}
