import HttpBaseClient from "./common/HttpBaseClient";
import {
  Institutionlocation
} from "../../types";

export class InstitutionLocationApi extends HttpBaseClient {
  public async createInstitutionLocation(
    createInstitutionLocationDto: Institutionlocation,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        "institution/location",
        createInstitutionLocationDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
