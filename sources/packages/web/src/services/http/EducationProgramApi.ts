import { SummaryEducationProgramDto } from "../../types";
import HttpBaseClient from "./common/HttpBaseClient";

export class EducationProgramApi extends HttpBaseClient {
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

  public async getPrograms(): Promise<SummaryEducationProgramDto[]> {
    try {
      const response = await this.apiClient.get(
        "institution/education-program",
        this.addAuthHeader(),
      );
      return response.data as SummaryEducationProgramDto[];
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
