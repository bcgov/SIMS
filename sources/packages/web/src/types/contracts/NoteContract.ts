import { NoteAPIOutDTO } from "@/services/http/dto";
import { Role } from "@/types/contracts/aest/roles";

/**
 * Enumeration types for Notes.
 */
export enum NoteType {
  /**
   * Note type general.
   */
  General = "General",
  /**
   * Note type Application.
   */
  Application = "Application",
  /**
   * Notes associated with a student appeal.
   */
  StudentAppeal = "Student appeal",
  /**
   * Notes associated with a student form.
   */
  StudentForm = "Student form",
  /**
   * Note type Program.
   */
  Program = "Program",
  /**
   * Note type Restriction.
   */
  Restriction = "Restriction",
  /**
   * Note type Designation.
   */
  Designation = "Designation",
  /**
   * Note type Overaward.
   */
  Overaward = "Overaward",
  /**
   * Note type System.
   */
  System = "System Actions",
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
   * Note type Application.
   */
  Application = "Application",
  /**
   * Note type for forms submissions
   * (e.g., Student Appeal, Student Forms).
   */
  Forms = "Forms",
  /**
   * Note type Restriction.
   */
  Restriction = "Restriction",
  /**
   * Note type Overaward.
   */
  Overaward = "Overaward",
  /**
   * Note type System.
   */
  System = "System Actions",
}

export interface NoteItemModel extends NoteAPIOutDTO {
  showMore: boolean;
}

/**
 * Map between specific student notes displayed to the user
 * and how they are interpreted by the API.
 */
export const STUDENT_NOTE_TO_NOTES_TYPE_MAP = new Map<
  StudentNoteType,
  NoteType[]
>([[StudentNoteType.Forms, [NoteType.StudentForm, NoteType.StudentAppeal]]]);

/**
 * Map note categories to the user roles, only if there is some
 * authorization to be applied to the role.
 */
export const STUDENT_NOTE_USER_ROLES_MAP = new Map<NoteType, Role>([
  [NoteType.StudentAppeal, Role.StudentApproveDeclineAppeals],
  [NoteType.StudentForm, Role.StudentApproveDeclineForms],
]);
