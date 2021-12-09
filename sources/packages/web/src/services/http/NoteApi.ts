import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { NoteDTO } from "@/types/contracts/NoteContract";
export class NoteApi extends HttpBaseClient {
  public async addInstitutionNote(
    institutionId: number,
    note: NoteDTO,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `notes/institution/${institutionId}`,
        note,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async addStudentNote(studentId: number, note: NoteDTO): Promise<void> {
    try {
      await this.apiClient.patch(
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
    const institutionNotes = await this.getCall(
      `notes/institution/${institutionId}${noteType ? "/" + noteType : ""}`,
    );
    return institutionNotes.data as NoteDTO[];
  }

  public async getStudentNotes(
    studentId: number,
    noteType?: string,
  ): Promise<NoteDTO[]> {
    const studentNotes = await this.getCall(
      `notes/institution/${studentId}${noteType ? "/" + noteType : ""}`,
    );
    return studentNotes.data as NoteDTO[];
  }
}
