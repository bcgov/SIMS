import { Institution, Note, NoteType, Student, User } from "@sims/sims-db";
import { faker } from "@faker-js/faker";
import { DataSource } from "typeorm";
import { createFakeUser } from "./user";

export function createFakeNote(
  noteType = NoteType.General,
  relations?: {
    creator: User;
  },
): Note {
  const note = new Note();
  note.noteType = noteType;
  note.description = faker.lorem.words(10);
  note.creator = relations?.creator ?? createFakeUser();
  return note;
}

/**
 * Create fake institution notes for the given institution.
 * @param dataSource persistance data source.
 * @param notes notes.
 * @param institutionId institution.
 * @param auditUser user who is creating institution notes.
 * When the value is not provided a user is created to save notes.
 * @returns institution notes.
 */
export async function saveFakeInstitutionNotes(
  dataSource: DataSource,
  notes: Note[],
  institutionId: number,
  auditUser?: User,
): Promise<Note[]> {
  if (!notes.length) {
    return [];
  }
  const userRepo = dataSource.getRepository(User);
  const noteRepo = dataSource.getRepository(Note);
  const institutionRepo = dataSource.getRepository(Institution);
  const user = auditUser ?? (await userRepo.save(createFakeUser()));
  for (const note of notes) {
    note.creator = user;
  }
  const persistedNotes = await noteRepo.save(notes);
  await institutionRepo
    .createQueryBuilder()
    .relation(Institution, "notes")
    .of({ id: institutionId } as Institution)
    .add(persistedNotes);
  return persistedNotes;
}

/**
 * Create fake student notes for the given student.
 * @param dataSource persistance data source.
 * @param notes notes.
 * @param studentId student.
 * @param auditUser user who is creating student notes.
 * When the value is not provided a user is created to save notes.
 * @returns student notes.
 */
export async function saveFakeStudentNotes(
  dataSource: DataSource,
  notes: Note[],
  studentId: number,
  auditUser?: User,
): Promise<Note[]> {
  if (!notes.length) {
    return [];
  }
  const userRepo = dataSource.getRepository(User);
  const noteRepo = dataSource.getRepository(Note);
  const studentRepo = dataSource.getRepository(Student);
  const user = auditUser ?? (await userRepo.save(createFakeUser()));
  for (const note of notes) {
    note.creator = user;
  }
  const persistedNotes = await noteRepo.save(notes);
  await studentRepo
    .createQueryBuilder()
    .relation(Student, "notes")
    .of({ id: studentId } as Student)
    .add(persistedNotes);
  return persistedNotes;
}
