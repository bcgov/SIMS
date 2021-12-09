export interface NoteBaseDTO {
  noteType: string;
  description: string;
}

export interface NoteDTO extends NoteBaseDTO {
  firstName: string;
  lastName: string;
  createdAt: Date;
}
