import { Note, NoteType } from "@sims/sims-db";

/**
 * Note associated with a student.
 */
export interface StudentNote {
  studentId: number;
  noteType: NoteType;
  description: string;
}

/**
 * Note created and associated with a student.
 */
export interface CreatedStudentNote {
  studentId: number;
  note: Note;
}
