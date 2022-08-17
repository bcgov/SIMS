import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { NoteAPIInDTO } from "@/services/http/dto";
import { NoteItemModel } from "@/types";

/**
 * Http API client for Notes.
 */
export class NoteApi extends HttpBaseClient {
  public async addInstitutionNote(
    institutionId: number,
    note: NoteAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(`note/institution/${institutionId}`),
      note,
    );
  }

  public async addStudentNote(
    studentId: number,
    note: NoteAPIInDTO,
  ): Promise<void> {
    await this.postCall(this.addClientRoot(`note/student/${studentId}`), note);
  }

  public async getInstitutionNotes(
    institutionId: number,
    noteType?: string,
  ): Promise<NoteItemModel[]> {
    const queryString = noteType ? `?noteType=${noteType}` : ``;
    return this.getCallTyped<NoteItemModel[]>(
      this.addClientRoot(`note/institution/${institutionId}${queryString}`),
    );
  }

  public async getStudentNotes(
    studentId: number,
    noteType?: string,
  ): Promise<NoteItemModel[]> {
    const queryString = noteType ? `?noteType=${noteType}` : ``;
    return this.getCallTyped<NoteItemModel[]>(
      this.addClientRoot(`note/student/${studentId}${queryString}`),
    );
  }
}
