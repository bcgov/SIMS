import { SummaryEducationProgramDto, EducationProgramDto } from "../types";
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

  public async getLocationProgramsSummary(
    locationId: number,
  ): Promise<SummaryEducationProgramDto[]> {
    return ApiClient.EducationProgram.getLocationProgramsSummary(locationId);
  }

  public async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramDto> {
    return ApiClient.EducationProgram.getEducationProgram(programId);
  }
}
