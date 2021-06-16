import { EducationProgramDto, SummaryEducationProgramDto } from "../types";
import ApiClient from "./http/ApiClient";

export class EducationProgramService {
  // Share Instance
  private static instance: EducationProgramService;

  public static get shared(): EducationProgramService {
    return this.instance || (this.instance = new this());
  }

  public async getProgram(programId: number): Promise<any> {
    return await ApiClient.EducationProgram.getProgram(programId);
  }

  public async createProgram(data: EducationProgramDto): Promise<void> {
    await ApiClient.EducationProgram.createProgram(data);
  }

  public async updateProgram(
    programId: number,
    data: EducationProgramDto,
  ): Promise<void> {
    await ApiClient.EducationProgram.updateProgram(programId, data);
  }

  public async getLocationProgramsSummary(
    locationId: number,
  ): Promise<SummaryEducationProgramDto[]> {
    return ApiClient.EducationProgram.getLocationProgramsSummary(locationId);
  }
}
