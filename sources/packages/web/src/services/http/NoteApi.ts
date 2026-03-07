import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { NoteAPIInDTO } from "@/services/http/dto";
import { NoteItemModel, NoteType } from "@/types";

/**
 * Http API client for Notes.
 */
export class NoteApi extends HttpBaseClient {
  async addInstitutionNote(
    institutionId: number,
    note: NoteAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(`note/institution/${institutionId}`),
      note,
    );
  }

  async addStudentNote(studentId: number, note: NoteAPIInDTO): Promise<void> {
    await this.postCall(this.addClientRoot(`note/student/${studentId}`), note);
  }

  /**
   * Gets notes for an Institution.
   * @param institutionId Institution ID.
   * @param noteTypes note types to filter the notes.
   * @returns institution notes.
   */
  async getInstitutionNotes(
    institutionId: number,
    noteTypes?: NoteType[],
  ): Promise<NoteItemModel[]> {
    let url = `note/institution/${institutionId}`;
    if (noteTypes?.length) {
      url += `?noteTypes=${noteTypes.join(",")}`;
    }
    return this.getCall<NoteItemModel[]>(this.addClientRoot(url));
  }

  /**
   * Get notes for a student.
   * @param studentId Student ID.
   * @param noteTypes note types to filter the notes.
   * @returns student notes.
   */
  async getStudentNotes(
    studentId: number,
    noteTypes?: NoteType[],
  ): Promise<NoteItemModel[]> {
    let url = `note/student/${studentId}`;
    if (noteTypes?.length) {
      url += `?noteTypes=${noteTypes.join(",")}`;
    }
    return this.getCall<NoteItemModel[]>(this.addClientRoot(url));
  }
}
