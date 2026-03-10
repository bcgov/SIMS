import { NoteType } from "@/types";

/**
 * Base DTO for note.
 */
export interface NoteAPIInDTO {
  noteType: NoteType;
  description: string;
}

/**
 * Notes detail DTO. This is used for view only purpose.
 */
export interface NoteAPIOutDTO {
  id: number;
  noteType: NoteType;
  description: string;
  createdBy: string;
  createdAt: Date;
}
