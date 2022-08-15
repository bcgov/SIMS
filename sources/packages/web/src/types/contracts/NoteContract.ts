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
  /**
   * Note type Designation.
   */
  Designation = "Designation",
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
