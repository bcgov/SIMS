import ApiClient from "@/services/http/ApiClient";
import { NoteAPIOutDTO, NoteBaseAPIInDTO } from "@/services/http/dto";

/**
 * Client service layer for Notes.
 */
export class NoteService {
  // Shared Instance
  private static instance: NoteService;

  public static get shared(): NoteService {
    return this.instance || (this.instance = new this());
  }

  async addInstitutionNote(
    institutionId: number,
    note: NoteBaseAPIInDTO,
  ): Promise<void> {
    await ApiClient.NoteApi.addInstitutionNote(institutionId, note);
  }

  async getInstitutionNotes(
    institutionId: number,
    noteType?: string,
  ): Promise<NoteAPIOutDTO[]> {
    return ApiClient.NoteApi.getInstitutionNotes(institutionId, noteType);
  }

  async addStudentNote(
    studentId: number,
    note: NoteBaseAPIInDTO,
  ): Promise<void> {
    await ApiClient.NoteApi.addStudentNote(studentId, note);
  }

  async getStudentNotes(
    studentId: number,
    noteType?: string,
  ): Promise<NoteAPIOutDTO[]> {
    return ApiClient.NoteApi.getStudentNotes(studentId, noteType);
  }
}
