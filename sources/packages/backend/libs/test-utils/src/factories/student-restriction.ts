import {
  Application,
  Note,
  NoteType,
  Restriction,
  Student,
  StudentRestriction,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { createFakeNote, saveFakeStudentNotes } from "./note";

/**
 * Creates a fake student restriction.
 * @param relations entity relations.
 * @returns a fake student restriction.
 */
export function createFakeStudentRestriction(relations: {
  student: Student;
  restriction: Restriction;
  application?: Application;
  note?: Note;
}): StudentRestriction {
  const studentRestriction = new StudentRestriction();
  studentRestriction.student = relations.student;
  studentRestriction.application = relations.application;
  studentRestriction.restriction = relations.restriction;
  studentRestriction.restrictionNote = relations.note;
  return studentRestriction;
}

/**
 * Saves a fake student restriction.
 * @param dataSource dataSource for the application.
 * @param relations entity relations.
 * @returns a persisted fake student restriction.
 */
export async function saveFakeStudentRestriction(
  dataSource: DataSource,
  relations: {
    student: Student;
    restriction: Restriction;
    application?: Application;
    note?: Note;
  },
): Promise<StudentRestriction> {
  const [note] = await saveFakeStudentNotes(
    dataSource,
    [createFakeNote(NoteType.Restriction)],
    relations.student.id,
  );
  relations.note = note;
  const studentRestrictionRepo = dataSource.getRepository(StudentRestriction);
  const studentRestriction = createFakeStudentRestriction(relations);
  return studentRestrictionRepo.save(studentRestriction);
}
