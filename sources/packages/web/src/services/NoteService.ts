import ApiClient from "@/services/http/ApiClient";
import { NoteDTO } from "@/types/contracts/NoteContract";

export class NoteService {
  // Shared Instance
  private static instance: NoteService;

  public static get shared(): NoteService {
    return this.instance || (this.instance = new this());
  }

  async addInstitutionNote(
    institutionId: number,
    note: NoteDTO,
  ): Promise<void> {
    await ApiClient.NoteApi.addInstitutionNote(institutionId, note);
  }

  public async getInstitutionNotes(
    institutionId: number,
    noteType?: string,
  ): Promise<NoteDTO[]> {
    const institutionNotes = await ApiClient.NoteApi.getInstitutionNotes(
      institutionId,
      noteType,
    );
    return institutionNotes;
  }
}
