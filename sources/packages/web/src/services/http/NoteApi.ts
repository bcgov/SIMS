import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { NoteDTO, NoteBaseDTO } from "@/types/contracts/NoteContract";

/**
 * Http API client for Notes.
 */
export class NoteApi extends HttpBaseClient {
  public async addInstitutionNote(
    institutionId: number,
    note: NoteBaseDTO,
  ): Promise<void> {
    try {
      await this.postCall(
        this.addClientRoot(`notes/institution/${institutionId}`),
        note,
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async addStudentNote(
    studentId: number,
    note: NoteBaseDTO,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        this.addClientRoot(`notes/student/${studentId}`),
        note,
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getInstitutionNotes(
    institutionId: number,
    noteType?: string,
  ): Promise<NoteDTO[]> {
    const queryString = noteType ? `?noteType=${noteType}` : ``;
    return this.getCallTyped<NoteDTO[]>(
      this.addClientRoot(`notes/institution/${institutionId}${queryString}`),
    );
  }

  public async getStudentNotes(
    studentId: number,
    noteType?: string,
  ): Promise<NoteDTO[]> {
    const queryString = noteType ? `?noteType=${noteType}` : ``;
    return this.getCallTyped<NoteDTO[]>(
      this.addClientRoot(`notes/student/${studentId}${queryString}`),
    );
  }
}
