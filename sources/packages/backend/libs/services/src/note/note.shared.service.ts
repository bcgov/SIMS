import { Injectable } from "@nestjs/common";
import { Institution, Note, NoteType, Student, User } from "@sims/sims-db";
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
    // Create the note to be associated with the student.
    const savedNote = await this.createNote(
      noteType,
      noteDescription,
      auditUserId,
      entityManager,
    );
    // Associate the created note with the student.
    await entityManager
      .getRepository(Student)
      .createQueryBuilder()
      .relation(Student, "notes")
      .of({ id: studentId } as Student)
      .add(savedNote);
    return savedNote;
  }

  /**
   * Creates a new note and associates it with the institution.
   * This method is most likely to be used alongside with some other
   * DB data changes and must be executed in a DB transaction.
   * @param institutionId institution to have the note associated.
   * @param noteType note type.
   * @param noteDescription note description.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager transactional entity manager.
   * @returns saved Note.
   */
  async createInstitutionNote(
    institutionId: number,
    noteType: NoteType,
    noteDescription: string,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<Note> {
    // Create the note to be associated with the institution.
    const savedNote = await this.createNote(
      noteType,
      noteDescription,
      auditUserId,
      entityManager,
    );
    // Associate the created note with the institution.
    await entityManager
      .getRepository(Institution)
      .createQueryBuilder()
      .relation(Institution, "notes")
      .of({ id: institutionId } as Institution)
      .add(savedNote);
    return savedNote;
  }

  /**
   * Creates a new note.
   * This method is most likely to be used alongside with some other
   * DB data changes and must be executed in a DB transaction.
   * @param noteType note type.
   * @param noteDescription note description.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager transactional entity manager.
   * @returns saved Note.
   */
  private async createNote(
    noteType: NoteType,
    noteDescription: string,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<Note> {
    const auditUser = { id: auditUserId } as User;
    // Create the note to be associated with the student or the institution user.
    const newNote = new Note();
    newNote.description = noteDescription;
    newNote.noteType = noteType;
    newNote.creator = auditUser;
    return entityManager.getRepository(Note).save(newNote);
  }
}
