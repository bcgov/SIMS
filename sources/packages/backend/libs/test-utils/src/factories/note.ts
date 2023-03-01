import { Institution, Note, NoteType, Student, User } from "@sims/sims-db";
import * as faker from "faker";
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
  note.description = faker.random.words(10);
  note.creator = relations?.creator ?? createFakeUser();
  return note;
}

export async function saveFakeInstitutionNotes(
  dataSource: DataSource,
  notes: Note[],
  institutionId: number,
  auditUser?: User,
): Promise<Note[]> {
  if (!notes.length) {
    return notes;
  }
  const userRepo = dataSource.getRepository(User);
  const noteRepo = dataSource.getRepository(Note);
  const institutionRepo = dataSource.getRepository(Institution);
  const user = auditUser ?? (await userRepo.save(createFakeUser()));
  for (const note of notes) {
    note.creator = user;
  }
  await noteRepo.save(notes);
  await institutionRepo
    .createQueryBuilder()
    .relation(Institution, "notes")
    .of({ id: institutionId } as Institution)
    .add(notes);
  return notes;
}

export async function saveFakeStudentNotes(
  dataSource: DataSource,
  notes: Note[],
  studentId: number,
  auditUser?: User,
): Promise<Note[]> {
  if (!notes.length) {
    return notes;
  }
  const userRepo = dataSource.getRepository(User);
  const noteRepo = dataSource.getRepository(Note);
  const studentRepo = dataSource.getRepository(Student);
  const user = auditUser ?? (await userRepo.save(createFakeUser()));
  for (const note of notes) {
    note.creator = user;
  }
  await noteRepo.save(notes);
  await studentRepo
    .createQueryBuilder()
    .relation(Student, "notes")
    .of({ id: studentId } as Student)
    .add(notes);
  return notes;
}
