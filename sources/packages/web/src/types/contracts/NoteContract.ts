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

/**
 * Enumeration types for Entity owning the note.
 */
export enum NoteEntityType {
  /**
   * Entity type student
   */
  Student = "student",
  /**
   * Entity type institution
   */
  Institution = "institution",
}

/**
 * Enumeration types for Student Notes.
 */
export enum StudentNoteType {
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
}
