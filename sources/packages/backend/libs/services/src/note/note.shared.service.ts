import { Injectable } from "@nestjs/common";
import { Note, NoteType, Student, User } from "@sims/sims-db";
import { EntityManager } from "typeorm";

/**
 * Shared service layer for Note.
 */
@Injectable()
export class NoteSharedService {
  /**
   * Creates a new note and associate it with the student.
   * This method is most likely to be used alongside with some other
   * DB data changes and must be executed in a DB transaction.
   * @param studentId student to have the note associated.
   * @param noteType note type.
   * @param noteDescription note description.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager transactional entity manager.
   * @returns note created for the student.
   */
  async createStudentNote(
    studentId: number,
    noteType: NoteType,
    noteDescription: string,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<Note> {
    const auditUser = { id: auditUserId } as User;
    // Create the note to be associated with the student.
    const newNote = new Note();
    newNote.description = noteDescription;
    newNote.noteType = noteType;
    newNote.creator = auditUser;
    const savedNote = await entityManager.getRepository(Note).save(newNote);
    // Associate the created note with the student.
    await entityManager
      .getRepository(Student)
      .createQueryBuilder()
      .relation(Student, "notes")
      .of({ id: studentId } as Student)
      .add(savedNote);
    return savedNote;
  }
}
