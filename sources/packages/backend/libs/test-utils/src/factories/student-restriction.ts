import {
  Application,
  Note,
  NoteType,
  Restriction,
  Student,
  StudentRestriction,
  User,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { createFakeNote, saveFakeStudentNotes } from "./note";
import { createFakeUser } from "./user";

/**
 * Create and save fake student restriction.
 * @param dataSource data source to persist student restriction.
 * @param relations student restriction entity relations.
 * - `student` related student.
 * - `application` application associated with the student.
 * - `restriction` restriction associated with the student.
 * - `restrictionNote` note for restriction.
 * - `resolutionNote` note for resolution.
 * - `creator` related user relation.
 * @param options options for student restriction.
 * - `isActive` option for specifying if the student restriction is active.
 * - `deletedAt` option for specifying if the student restriction is deleted.
 * @returns persisted student restriction.
 */
export function createFakeStudentRestriction(
  relations: {
    student: Student;
    application?: Application;
    restriction: Restriction;
    restrictionNote?: Note;
    resolutionNote?: Note;
    creator?: User;
  },
  options?: { isActive?: boolean; deletedAt?: Date },
): StudentRestriction {
  const studentRestriction = new StudentRestriction();
  studentRestriction.student = relations.student;
  studentRestriction.application = relations.application;
  studentRestriction.restriction = relations.restriction;
  studentRestriction.restrictionNote = relations.restrictionNote;
  studentRestriction.resolutionNote = relations.resolutionNote;
  studentRestriction.isActive = options?.isActive ?? true;
  studentRestriction.creator = relations?.creator;
  studentRestriction.deletedAt = options?.deletedAt;
  return studentRestriction;
}

/**
 * Saves a fake student restriction.
 * @param dataSource dataSource for the application.
 * @param relations entity relations.
 * - `student` related student.
 * - `application` application associated with the student.
 * - `restriction` restriction associated with the student. If not provided, one will be created.
 * - `restrictionNote` note for restriction.  If not provided, one will be created.
 * - `resolutionNote` note for resolution.  If not provided, one will be created.
 * - `creator` related user relation. If not provided, one will be created.
 * @param options related to student restriction.
 * - `isActive` option for specifying if the student restriction is active.
 * - `deletedAt` option for specifying if the student restriction is deleted.
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
    creator?: User;
  },
  options?: { isActive?: boolean; deletedAt?: Date },
): Promise<StudentRestriction> {
  const [restrictionNote, resolutionNote] = await saveFakeStudentNotes(
    dataSource,
    [
      createFakeNote(NoteType.Restriction),
      createFakeNote(NoteType.Restriction),
    ],
    relations.student.id,
  );
  const userRepo = dataSource.getRepository(User);
  const user = relations?.creator ?? createFakeUser();
  if (!relations?.creator) {
    userRepo.save(user);
  }
  relations.restrictionNote = restrictionNote;
  relations.resolutionNote = resolutionNote;
  const studentRestrictionRepo = dataSource.getRepository(StudentRestriction);
  const studentRestriction = createFakeStudentRestriction(relations, options);
  return studentRestrictionRepo.save(studentRestriction);
}
