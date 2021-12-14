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
      await this.apiClient.post(
        `notes/institution/${institutionId}`,
        note,
        this.addAuthHeader(),
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
        `notes/student/${studentId}`,
        note,
        this.addAuthHeader(),
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
    const institutionNotes = await this.getCall(
      `notes/institution/${institutionId}${queryString}`,
    );
    return institutionNotes.data as NoteDTO[];
  }

  public async getStudentNotes(
    studentId: number,
    noteType?: string,
  ): Promise<NoteDTO[]> {
    const queryString = noteType ? `?noteType=${noteType}` : ``;
    const studentNotes = await this.getCall(
      `notes/student/${studentId}${queryString}`,
    );
    return studentNotes.data as NoteDTO[];
  }
}
