import { Note, NoteType, User } from "@sims/sims-db";
import * as faker from "faker";
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
