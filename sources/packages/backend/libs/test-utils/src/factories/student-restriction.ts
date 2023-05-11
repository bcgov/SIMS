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
  restrictionNote?: Note;
  resolutionNote?: Note;
}): StudentRestriction {
  const studentRestriction = new StudentRestriction();
  studentRestriction.student = relations.student;
  studentRestriction.application = relations.application;
  studentRestriction.restriction = relations.restriction;
  studentRestriction.restrictionNote = relations.restrictionNote;
  studentRestriction.resolutionNote = relations.resolutionNote;
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
    restrictionNote?: Note;
    resolutionNote?: Note;
  },
): Promise<StudentRestriction> {
  const [restrictionNote, resolutionNote] = await saveFakeStudentNotes(
    dataSource,
    [
      createFakeNote(NoteType.Restriction),
      createFakeNote(NoteType.Restriction),
    ],
    relations.student.id,
  );
  relations.restrictionNote = restrictionNote;
  relations.resolutionNote = resolutionNote;
  const studentRestrictionRepo = dataSource.getRepository(StudentRestriction);
  const studentRestriction = createFakeStudentRestriction(relations);
  return studentRestrictionRepo.save(studentRestriction);
}
