import ApiClient from "@/services/http/ApiClient";
import { NoteAPIInDTO } from "@/services/http/dto";
import {
  InstitutionNoteType,
  NoteItemModel,
  NoteType,
  STUDENT_NOTE_TO_NOTES_TYPE_MAP,
  StudentNoteType,
} from "@/types";

/**
 * Client service layer for Notes.
 */
export class NoteService {
  // Shared Instance
  private static instance: NoteService;

  static get shared(): NoteService {
    return this.instance || (this.instance = new this());
  }

  async addInstitutionNote(
    institutionId: number,
    note: NoteAPIInDTO,
  ): Promise<void> {
    await ApiClient.NoteApi.addInstitutionNote(institutionId, note);
  }

  /**
   * Gets notes for an Institution.
   * @param institutionId Institution ID.
   * @param institutionNote institution note type to filter the notes.
   * @returns institution notes.
   */
  async getInstitutionNotes(
    institutionId: number,
    institutionNote?: InstitutionNoteType,
  ): Promise<NoteItemModel[]> {
    return ApiClient.NoteApi.getInstitutionNotes(
      institutionId,
      institutionNote ? [institutionNote as string as NoteType] : undefined,
    );
  }

  async addStudentNote(studentId: number, note: NoteAPIInDTO): Promise<void> {
    await ApiClient.NoteApi.addStudentNote(studentId, note);
  }

  /**
   * Get notes for a student.
   * @param studentId Student ID.
   * @param studentNote student note type to filter the notes.
   * @returns student notes.
   */
  async getStudentNotes(
    studentId: number,
    studentNote?: StudentNoteType,
  ): Promise<NoteItemModel[]> {
    if (!studentNote?.length) {
      return ApiClient.NoteApi.getStudentNotes(studentId);
    }
    const convertedNotes = STUDENT_NOTE_TO_NOTES_TYPE_MAP.get(studentNote) ?? [
      studentNote as string as NoteType,
    ];
    return ApiClient.NoteApi.getStudentNotes(studentId, convertedNotes);
  }
}
