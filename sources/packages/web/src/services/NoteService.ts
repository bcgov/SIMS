import ApiClient from "@/services/http/ApiClient";
import { NoteDTO, NoteBaseDTO } from "@/types/contracts/NoteContract";

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
    note: NoteBaseDTO,
  ): Promise<void> {
    await ApiClient.NoteApi.addInstitutionNote(institutionId, note);
  }

  public async getInstitutionNotes(
    institutionId: number,
    noteType?: string,
  ): Promise<NoteDTO[]> {
    return await ApiClient.NoteApi.getInstitutionNotes(institutionId, noteType);
  }

  async addStudentNote(studentId: number, note: NoteBaseDTO): Promise<void> {
    await ApiClient.NoteApi.addStudentNote(studentId, note);
  }

  public async getStudentNotes(
    studentId: number,
    noteType?: string,
  ): Promise<NoteDTO[]> {
    return await ApiClient.NoteApi.getStudentNotes(studentId, noteType);
  }
}
