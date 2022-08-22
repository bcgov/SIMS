import ApiClient from "@/services/http/ApiClient";
import { NoteAPIInDTO } from "@/services/http/dto";
import { NoteItemModel } from "@/types";

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

  async getInstitutionNotes(
    institutionId: number,
    noteType?: string,
  ): Promise<NoteItemModel[]> {
    return ApiClient.NoteApi.getInstitutionNotes(institutionId, noteType);
  }

  async addStudentNote(studentId: number, note: NoteAPIInDTO): Promise<void> {
    await ApiClient.NoteApi.addStudentNote(studentId, note);
  }

  async getStudentNotes(
    studentId: number,
    noteType?: string,
  ): Promise<NoteItemModel[]> {
    return ApiClient.NoteApi.getStudentNotes(studentId, noteType);
  }
}
