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
  showMore?: boolean;
}

/**
 * Enumeration types for Institution Notes.
 */
export enum InstitutionNoteType {
  /**
   * Note type general.
   */
  General = "General",
  /**
   * Note type Restriction.
   */
  Restriction = "Restriction",
  /**
   * Note type System.
   */
  System = "System Actions",
  /**
   * Note type Program.
   */
  Program = "Program",
}
