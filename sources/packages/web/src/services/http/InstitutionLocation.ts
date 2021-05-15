import HttpBaseClient from "./common/HttpBaseClient";
import {
  Institutionlocation,
  InstitutionlocationData
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

  public async allInstitutionLocationsApi(): Promise<any> {
    let data: InstitutionlocationData[] = [];
    try {
      const res = await this.apiClient.get(
        "institution/location",
        this.addAuthHeader(),
      );
      data = res?.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
    return data;
  }
}
