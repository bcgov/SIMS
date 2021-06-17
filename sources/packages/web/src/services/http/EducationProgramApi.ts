import { SummaryEducationProgramDto, EducationProgramDto } from "../../types";
import HttpBaseClient from "./common/HttpBaseClient";

export class EducationProgramApi extends HttpBaseClient {
  public async getProgram(programId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/${programId}`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async createProgram(createProgramDto: any): Promise<void> {
    try {
      await this.apiClient.post(
        "institution/education-program",
        createProgramDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateProgram(
    programId: number,
    updateProgramDto: any,
  ): Promise<void> {
    try {
      await this.apiClient.put(
        `institution/education-program/${programId}`,
        updateProgramDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getLocationProgramsSummary(
    locationId: number,
  ): Promise<SummaryEducationProgramDto[]> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/location/${locationId}/summary`,
        this.addAuthHeader(),
      );
      return response.data as SummaryEducationProgramDto[];
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramDto> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/program/${programId}`,
        this.addAuthHeader(),
      );
      return response.data as EducationProgramDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
