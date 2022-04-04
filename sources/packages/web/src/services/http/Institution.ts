import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionDto,
  InstitutionUserAndAuthDetailsForStore,
  OptionItemDto,
  ApplicationSummaryDTO,
  SearchInstitutionResp,
  BasicInstitutionInfo,
  InstitutionUserAndCount,
  DataTableSortOrder,
  UserAuth,
  FieldSortOrder,
  InstitutionUserTypeAndRoleResponseDto,
  AESTInstitutionProgramsSummaryDto,
  PaginatedResults,
  InstitutionDetailDTO,
  InstitutionContactDTO,
  InstitutionProfileDTO,
} from "@/types";

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

  public async updateInstitution(
    data: InstitutionContactDTO | InstitutionProfileDTO,
    institutionId?: number,
  ): Promise<void> {
    const url = institutionId ? `institution/${institutionId}` : "institution";
    await this.patchCall<InstitutionContactDTO>(this.addClientRoot(url), data);
  }

  public async getDetail(
    institutionId?: number,
    authHeader?: any,
  ): Promise<InstitutionDetailDTO> {
    const url = institutionId ? `institution/${institutionId}` : "institution";
    return this.getCallTyped<InstitutionDetailDTO>(
      this.addClientRoot(url),
      authHeader,
    );
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

  public async getUserTypeAndRoles(): Promise<InstitutionUserTypeAndRoleResponseDto> {
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
    searchCriteria: string,
    sortColumn?: string,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<AESTInstitutionProgramsSummaryDto>> {
    const sortByOrder =
      sortOrder === DataTableSortOrder.ASC
        ? FieldSortOrder.ASC
        : FieldSortOrder.DESC; //Default sort order
    try {
      let queryString = "";
      if (searchCriteria) {
        queryString += `searchCriteria=${searchCriteria}&`;
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
        `institution/education-program/institution/${institutionId}/aest?${queryString.slice(
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
