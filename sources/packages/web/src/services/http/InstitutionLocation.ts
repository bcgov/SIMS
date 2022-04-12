import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionUserDto,
  InstitutionLocationUserAuthDto,
  LocationStateForStore,
} from "../../types";
import {
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
  InstitutionLocationAPIOutDTO,
  ActiveApplicationDataAPIOutDTO,
} from "@/services/http/dto";

import { OptionItemAPIOutDTO } from "@/services/http/dto";
export class InstitutionLocationApi extends HttpBaseClient {
  public async createInstitutionLocation(
    createInstitutionLocationDto: InstitutionLocationFormAPIInDTO,
  ): Promise<void> {
    return this.postCall<InstitutionLocationFormAPIInDTO>(
      this.addClientRoot("institution/location"),
      createInstitutionLocationDto,
    );
  }

  public async updateInstitutionLocation(
    locationId: number,
    updateInstitutionLocationDto: InstitutionLocationFormAPIInDTO,
  ): Promise<void> {
    return this.patchCall<InstitutionLocationFormAPIInDTO>(
      this.addClientRoot(`institution/location/${locationId}`),
      updateInstitutionLocationDto,
    );
  }

  public async getInstitutionLocation(
    locationId: number,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    return this.getCallTyped<InstitutionLocationFormAPIOutDTO>(
      this.addClientRoot(`institution/location/${locationId}`),
    );
  }

  public async allInstitutionLocations(
    institutionId?: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    const url = institutionId
      ? `institution/location/${institutionId}`
      : "institution/location";
    return this.getCallTyped<InstitutionLocationAPIOutDTO[]>(
      this.addClientRoot(url),
    );
  }
  /**
   * This client expects custom error message in one or more
   * scenarios and hence trying to parse and throw the message
   * if available.
   * @param createInstitutionUserDto
   */
  public async createUser(
    createInstitutionUserDto: InstitutionUserDto,
  ): Promise<void> {
    await this.apiClient
      .post("institution/user", createInstitutionUserDto, this.addAuthHeader())
      .catch((error) => {
        this.handleCustomError(error);
      });
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

  /**
   * This client expects custom error message in one or more
   * scenarios and hence trying to parse and throw the message
   * if available.
   * @param updateInstitutionUserDto
   */
  public async updateUser(
    userName: string,
    updateInstitutionUserDto: InstitutionUserDto,
  ): Promise<void> {
    await this.apiClient
      .patch(
        `institution/user/${userName}`,
        updateInstitutionUserDto,
        this.addAuthHeader(),
      )
      .catch((error) => {
        this.handleCustomError(error);
      });
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

  public async getOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCallTyped<OptionItemAPIOutDTO[]>(
      this.addClientRoot("institution/location/options-list"),
    );
  }

  public async getActiveApplication(
    applicationId: number,
    locationId: number,
  ): Promise<ActiveApplicationDataAPIOutDTO> {
    return this.getCallTyped<ActiveApplicationDataAPIOutDTO>(
      this.addClientRoot(
        `institution/location/${locationId}/active-application/${applicationId}`,
      ),
    );
  }
}
