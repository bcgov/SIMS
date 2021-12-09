export interface NoteDTO {
  noteType: string;
  description: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
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
  System = "System",
  /**
   * Note type Program.
   */
  Program = "Program",
}
