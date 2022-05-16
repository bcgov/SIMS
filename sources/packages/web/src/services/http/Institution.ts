import HttpBaseClient from "./common/HttpBaseClient";
import {
  OptionItemDto,
  DataTableSortOrder,
  FieldSortOrder,
  AESTInstitutionProgramsSummaryDto,
  PaginatedResults,
} from "@/types";
import {
  ActiveApplicationSummaryAPIOutDTO,
  InstitutionDetailAPIOutDTO,
  InstitutionContactAPIInDTO,
  InstitutionProfileAPIInDTO,
  InstitutionUserAPIOutDTO,
  SearchInstitutionAPIOutDTO,
  InstitutionBasicAPIOutDTO,
  InstitutionFormAPIInDTO,
  InstitutionUserTypeAndRoleAPIOutDTO,
  InstitutionUserDetailAPIOutDTO,
  UserRoleOptionAPIOutDTO,
  InstitutionLocationAPIOutDTO,
} from "@/services/http/dto";

export class InstitutionApi extends HttpBaseClient {
  public async createInstitution(
    createInstitutionDto: InstitutionFormAPIInDTO,
  ): Promise<void> {
    return this.postCall<InstitutionFormAPIInDTO>(
      this.addClientRoot("institution"),
      createInstitutionDto,
    );
  }

  public async updateInstitution(
    data: InstitutionContactAPIInDTO | InstitutionProfileAPIInDTO,
    institutionId?: number,
  ): Promise<void> {
    const url = institutionId ? `institution/${institutionId}` : "institution";
    await this.patchCall<
      InstitutionContactAPIInDTO | InstitutionProfileAPIInDTO
    >(this.addClientRoot(url), data);
  }

  public async getDetail(
    institutionId?: number,
    authHeader?: any,
  ): Promise<InstitutionDetailAPIOutDTO> {
    const url = institutionId ? `institution/${institutionId}` : "institution";
    return this.getCallTyped<InstitutionDetailAPIOutDTO>(
      this.addClientRoot(url),
      authHeader,
    );
  }

  public async sync() {
    return this.patchCall(this.addClientRoot("institution/sync"), {});
  }

  public async getUserTypeAndRoles(): Promise<InstitutionUserTypeAndRoleAPIOutDTO> {
    return this.getCallTyped<InstitutionUserTypeAndRoleAPIOutDTO>(
      this.addClientRoot("institution/user-types-roles"),
    );
  }

  public async getMyInstitutionDetails(
    header?: any,
  ): Promise<InstitutionUserDetailAPIOutDTO> {
    return this.getCallTyped<InstitutionUserDetailAPIOutDTO>(
      this.addClientRoot("institution/my-details"),
      header,
    );
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
      await this.apiClient.head(
        this.addClientRoot(`institution/${guid}`),
        headers,
      );
      return true;
    } catch (error) {
      if (404 === error.response.status) {
        return false;
      }
      this.handleRequestError(error);
      throw error;
    }
  }

  public async allInstitutionLocations(
    institutionId?: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    const url = institutionId
      ? `institution/${institutionId}/locations`
      : "institution/locations";
    return this.getCallTyped<InstitutionLocationAPIOutDTO[]>(
      this.addClientRoot(url),
    );
  }

  public async getActiveApplicationsSummary(
    locationId: number,
  ): Promise<ActiveApplicationSummaryAPIOutDTO[]> {
    return this.getCallTyped<ActiveApplicationSummaryAPIOutDTO[]>(
      this.addClientRoot(`location/${locationId}/active-applications`),
    );
  }

  public async searchInstitutions(
    legalName: string,
    operatingName: string,
  ): Promise<SearchInstitutionAPIOutDTO[]> {
    let queryString = "";
    if (legalName) {
      queryString += `legalName=${legalName}&`;
    }
    if (operatingName) {
      queryString += `operatingName=${operatingName}&`;
    }
    const url = `institution/search?${queryString.slice(0, -1)}`;
    return this.getCallTyped<SearchInstitutionAPIOutDTO[]>(
      this.addClientRoot(url),
    );
  }

  public async getBasicInstitutionInfoById(
    institutionId: number,
  ): Promise<InstitutionBasicAPIOutDTO> {
    return this.getCallTyped<InstitutionBasicAPIOutDTO>(
      this.addClientRoot(`institution/${institutionId}/basic-details`),
    );
  }

  /**
   * Controller method to get all institution users.
   * @param url url to be send
   * @returns All the institution users for the given institution.
   */
  public async institutionUserSummary(
    url: string,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    return this.getCallTyped<PaginatedResults<InstitutionUserAPIOutDTO>>(
      this.addClientRoot(url),
    );
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

  public async getGetAdminRoleOptions(): Promise<UserRoleOptionAPIOutDTO[]> {
    return this.getCallTyped<UserRoleOptionAPIOutDTO[]>(
      this.addClientRoot("institution/admin-roles"),
    );
  }
}
