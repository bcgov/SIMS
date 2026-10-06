import { NoteType } from "@sims/sims-db";

/**
 * Note associated with a student.
 */
export interface StudentNote {
  studentId: number;
  noteType: NoteType;
  description: string;
}
