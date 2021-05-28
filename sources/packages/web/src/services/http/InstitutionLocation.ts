import HttpBaseClient from "./common/HttpBaseClient";
import {
  Institutionlocation,
  InstitutionLocationsDetails,
  InstitutionUserDto,
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

  public async updateInstitutionLocation(
    locationId: number,
    updateInstitutionLocationDto: Institutionlocation,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `institution/location/${locationId}`,
        updateInstitutionLocationDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getInstitutionLocation(
    locationId: number,
  ): Promise<InstitutionLocationsDetails> {
    let data: InstitutionLocationsDetails;
    try {
      const res = await this.apiClient.get(
        `institution/location/${locationId}`,
        this.addAuthHeader(),
      );
      data = res?.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
    return data;
  }

  public async allInstitutionLocationsApi(): Promise<
    InstitutionLocationsDetails[]
  > {
    let data: InstitutionLocationsDetails[] = [];
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

  public async createUser(
    createInstitutionUserDto: InstitutionUserDto,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        "institution/user",
        createInstitutionUserDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getInstitutionLocationUserDetails(
    userName: string
    ): Promise<any>{
      try {
        return await this.apiClient.get(
          `institution/user/${userName}`,
          this.addAuthHeader(),
        );
      } catch (error) {
        this.handleRequestError(error);
        throw error;
      }
  }
}
