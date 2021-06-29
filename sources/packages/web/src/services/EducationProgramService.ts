import { EducationProgramDto, OptionItemDto } from "../types";
import ApiClient from "./http/ApiClient";

export class EducationProgramService {
  // Share Instance
  private static instance: EducationProgramService;

  public static get shared(): EducationProgramService {
    return this.instance || (this.instance = new this());
  }

  public async getProgram(programId: number): Promise<any> {
    return ApiClient.EducationProgram.getProgram(programId);
  }

  public async createProgram(data: any): Promise<void> {
    await ApiClient.EducationProgram.createProgram(data);
  }

  public async updateProgram(programId: number, data: any): Promise<void> {
    await ApiClient.EducationProgram.updateProgram(programId, data);
  }

  public async getLocationProgramsSummary(locationId: number): Promise<any> {
    return ApiClient.EducationProgram.getLocationProgramsSummary(locationId);
  }

  public async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramDto> {
    return ApiClient.EducationProgram.getEducationProgram(programId);
  }

  public async getLocationProgramsOptionList(
    locationId: number,
  ): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgram.getLocationProgramsOptionList(locationId);
  }
}
