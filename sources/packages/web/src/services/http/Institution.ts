import HttpBaseClient from "./common/HttpBaseClient";
import { CreateInstitutionDto } from "../../types";

export class InstitutionApi extends HttpBaseClient {
  public async createInstitution(
    createInstitutionDto: CreateInstitutionDto,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        "institution",
        createInstitutionDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
