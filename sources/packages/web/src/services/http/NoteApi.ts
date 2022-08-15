import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { NoteAPIOutDTO, NoteBaseAPIInDTO } from "@/services/http/dto";

/**
 * Http API client for Notes.
 */
export class NoteApi extends HttpBaseClient {
  public async addInstitutionNote(
    institutionId: number,
    note: NoteBaseAPIInDTO,
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
    note: NoteBaseAPIInDTO,
  ): Promise<void> {
    try {
      await this.postCall(
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
  ): Promise<NoteAPIOutDTO[]> {
    const queryString = noteType ? `?noteType=${noteType}` : ``;
    return this.getCallTyped<NoteAPIOutDTO[]>(
      this.addClientRoot(`notes/institution/${institutionId}${queryString}`),
    );
  }

  public async getStudentNotes(
    studentId: number,
    noteType?: string,
  ): Promise<NoteAPIOutDTO[]> {
    const queryString = noteType ? `?noteType=${noteType}` : ``;
    return this.getCallTyped<NoteAPIOutDTO[]>(
      this.addClientRoot(`notes/student/${studentId}${queryString}`),
    );
  }
}
