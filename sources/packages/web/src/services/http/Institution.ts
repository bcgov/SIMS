import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionDto,
  InstitutionDetailDto,
  UpdateInstitutionDto,
} from "../../types";

export class InstitutionApi extends HttpBaseClient {
  public async createInstitution(
    createInstitutionDto: InstitutionDto,
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

  public async updateInstitution(data: UpdateInstitutionDto) {
    try {
      await this.apiClient.patch("institution", data, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getDetail(): Promise<InstitutionDetailDto> {
    try {
      return this.getCall("institution");
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
