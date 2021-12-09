import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionLocation,
  InstitutionLocationsDetails,
  InstitutionUserDto,
  InstitutionLocationUserAuthDto,
  LocationStateForStore,
  OptionItemDto,
  ApplicationDetails,
} from "../../types";
export class InstitutionLocationApi extends HttpBaseClient {
  public async createInstitutionLocation(
    createInstitutionLocationDto: InstitutionLocation,
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
    updateInstitutionLocationDto: InstitutionLocation,
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
    userName: string,
  ): Promise<InstitutionLocationUserAuthDto> {
    try {
      const result = await this.apiClient.get(
        `institution/user/${userName}`,
        this.addAuthHeader(),
      );
      return result?.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateUser(
    userName: string,
    updateInstitutionUserDto: InstitutionUserDto,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `institution/user/${userName}`,
        updateInstitutionUserDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateUserStatus(
    userName: string,
    userStatus: boolean,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `institution/user-status/${userName}`,
        { isActive: userStatus },
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getMyInstitutionLocationsDetails(
    header?: any,
  ): Promise<LocationStateForStore> {
    try {
      const res = await this.apiClient.get(
        `institution/my-locations`,
        header || this.addAuthHeader(),
      );
      return res?.data as LocationStateForStore;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getOptionsList(): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        "institution/location/options-list",
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getActiveApplication(
    applicationId: number,
    locationId: number,
  ): Promise<ApplicationDetails> {
    try {
      const response = await this.apiClient.get(
        `institution/location/${locationId}/active-application/${applicationId}`,
        this.addAuthHeader(),
      );
      return response.data as ApplicationDetails;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Controller method to get institution locations for the given
   * institutionId for  ministry user.
   * @param institutionId institution id
   * @returns All the institution locations for the given institution.
   */
  public async getAllInstitutionLocationSummary(
    institutionId: number,
  ): Promise<InstitutionLocationsDetails[]> {
    let data: InstitutionLocationsDetails[] = [];
    try {
      const res = await this.apiClient.get(
        `institution/${institutionId}/location-summary`,
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
