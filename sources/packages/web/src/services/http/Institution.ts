import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionDto,
  InstitutionDetailDto,
  UpdateInstitutionDto,
  InstitutionUserAndAuthDetailsForStore,
  OptionItemDto,
  ApplicationSummaryDTO,
  SearchInstitutionResp,
  AESTInstitutionDetailDto,
  BasicInstitutionInfo,
  InstitutionUserAndCount,
  AESTInstitutionProgramsSummaryPaginatedDto,
  SortDBOrder,
  UserAuth,
} from "../../types";
import { AxiosResponse } from "axios";
import { InstitutionUserTypeAndRoleResponseDto } from "../../types/contracts/institution/InstitutionUserTypeAndRoleResponseDto";

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

  public async getDetail(authHeader?: any): Promise<InstitutionDetailDto> {
    try {
      const resp: AxiosResponse<InstitutionDetailDto> = await this.getCall(
        "institution",
        authHeader,
      );
      return resp.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async sync() {
    try {
      await this.apiClient.patch("institution/sync", {}, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async removeUser(id: number): Promise<void> {
    await this.apiClient.delete(`institution/user/${id}`, this.addAuthHeader());
  }

  public async getUserTypeAndRoles(): Promise<
    InstitutionUserTypeAndRoleResponseDto
  > {
    try {
      const resp = await this.apiClient.get(
        "institution/user-types-roles",
        this.addAuthHeader(),
      );
      return resp.data as InstitutionUserTypeAndRoleResponseDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getMyInstitutionDetails(
    header?: any,
  ): Promise<InstitutionUserAndAuthDetailsForStore> {
    try {
      const res = await this.apiClient.get(
        `institution/my-details`,
        header || this.addAuthHeader(),
      );
      return res?.data as InstitutionUserAndAuthDetailsForStore;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getInstitutionTypeOptions(): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        "institution/type/options-list",
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async checkIfExist(guid: string, headers: any): Promise<boolean> {
    try {
      await this.apiClient.head(`institution/${guid}`, headers);
      return true;
    } catch (error) {
      if (404 === error.response.status) {
        return false;
      }
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getActiveApplicationsSummary(
    locationId: number,
  ): Promise<ApplicationSummaryDTO[]> {
    try {
      const response = await this.apiClient.get(
        `institution/location/${locationId}/active-applications`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async searchInstitutions(
    legalName: string,
    operatingName: string,
  ): Promise<SearchInstitutionResp[]> {
    try {
      let queryString = "";
      if (legalName) {
        queryString += `legalName=${legalName}&`;
      }
      if (operatingName) {
        queryString += `operatingName=${operatingName}&`;
      }
      const institution = await this.getCall(
        `institution/search?${queryString.slice(0, -1)}`,
      );
      return institution.data as SearchInstitutionResp[];
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getAESTInstitutionDetailById(
    institutionId: number,
  ): Promise<AESTInstitutionDetailDto> {
    try {
      const response = await this.getCall(
        `institution/${institutionId}/detail`,
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getBasicInstitutionInfoById(
    institutionId: number,
  ): Promise<BasicInstitutionInfo> {
    try {
      const response = await this.getCall(
        `institution/${institutionId}/basic-details`,
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Controller method to get all institution users.
   * ! Because of code duplication, this function
   * ! is used in both AEST(Ministry) institution summary
   * ! as well as institution admin user summary.
   * ! only passed URL value will be different.
   * ! Both are using same interface
   * ! In future, if any of them needs a
   * ! different interface, use create a
   * ! different functions for both
   * @param url url to be send
   * @returns All the institution users for the given institution.
   */
  public async institutionSummary(
    url: string,
  ): Promise<InstitutionUserAndCount> {
    const response = await this.getCall(url);
    return response.data as InstitutionUserAndCount;
  }

  public async getPaginatedAESTInstitutionProgramsSummary(
    institutionId: number,
    pageSize: number,
    page: number,
    sortColumn: string,
    sortOrder: SortDBOrder,
    searchName: string,
  ): Promise<AESTInstitutionProgramsSummaryPaginatedDto> {
    const sortByOrder = sortOrder === SortDBOrder.ASC ? "ASC" : "DESC"; //Default sort order
    try {
      let queryString = "";
      if (searchName) {
        queryString += `searchProgramName=${searchName}&`;
      }
      if (sortColumn) {
        queryString += `sortColumn=${sortColumn}&`;
      }
      if (sortByOrder) {
        queryString += `sortOrder=${sortByOrder}&`;
      }
      if (pageSize) {
        queryString += `pageSize=${pageSize}&`;
      }
      queryString += `page=${page}&`;
      const response = await this.apiClient.get(
        `institution/offering/institution/${institutionId}/programs?${queryString.slice(
          0,
          -1,
        )}`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getGetAdminRoleOptions(): Promise<UserAuth[]> {
    const response = await this.getCall("institution/admin-roles");
    return response.data as UserAuth[];
  }
}
