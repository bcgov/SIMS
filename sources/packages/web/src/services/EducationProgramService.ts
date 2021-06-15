import { SummaryEducationProgramDto } from "../types";
import ApiClient from "./http/ApiClient";

export class EducationProgramService {
  // Share Instance
  private static instance: EducationProgramService;

  public static get shared(): EducationProgramService {
    return this.instance || (this.instance = new this());
  }

  public async createProgram(data: any): Promise<void> {
    await ApiClient.EducationProgram.createProgram(data);
  }

  public async getPrograms(): Promise<SummaryEducationProgramDto[]> {
    return ApiClient.EducationProgram.getPrograms();
  }
}
