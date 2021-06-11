import HttpBaseClient from "./common/HttpBaseClient";
import { CreateEducationProgramDto } from "../../types";

export class EducationProgramApi extends HttpBaseClient {
  public async createProgram(
    createProgramDto: CreateEducationProgramDto,
  ): Promise<void> {
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
}
