import HttpBaseClient from "./common/HttpBaseClient";
import {
  OptionItemDto,
  DataTableSortOrder,
  FieldSortOrder,
  AESTInstitutionProgramsSummaryDto,
  PaginatedResults,
  PaginationOptions,
  PaginationParams,
} from "@/types";
import {
  ActiveApplicationSummaryAPIOutDTO,
  InstitutionDetailAPIOutDTO,
  InstitutionContactAPIInDTO,
  InstitutionProfileAPIInDTO,
  InstitutionUserAPIOutDTO,
  SearchInstitutionAPIOutDTO,
  InstitutionBasicAPIOutDTO,
  CreateInstitutionAPIInDTO,
  InstitutionUserTypeAndRoleAPIOutDTO,
  InstitutionUserDetailAPIOutDTO,
  UserRoleOptionAPIOutDTO,
  InstitutionLocationAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  AESTCreateInstitutionAPIInDTO,
  PrimaryIdentifierAPIOutDTO,
  InstitutionUserStatusAPIOutDTO,
} from "@/services/http/dto";
import { addPaginationOptions, addSortOptions } from "@/helpers";

export class InstitutionApi extends HttpBaseClient {
  /**
   * Create institutions that are not allowed to create the profile by
   * themselves due to limitations, for instance, when the institution
   * has only a basic BCeID login.
   * @param createInstitutionDTO complete information to create the profile.
   */
  async createInstitution(
    createInstitutionDTO: AESTCreateInstitutionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.postCall<AESTCreateInstitutionAPIInDTO>(
      this.addClientRoot("institution"),
      createInstitutionDTO,
    );
  }

  /**
   * Creates an institution during institution setup process when the
   * institution profile and the user are created and associated altogether.
   * @param createInstitutionDto information from the institution and the user.
   */
  async createInstitutionWithAssociatedUser(
    createInstitutionDto: CreateInstitutionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.postCall<CreateInstitutionAPIInDTO>(
      this.addClientRoot("institution"),
      createInstitutionDto,
    );
  }

  async updateInstitution(
    data: InstitutionContactAPIInDTO | InstitutionProfileAPIInDTO,
    institutionId?: number,
  ): Promise<void> {
    const url = institutionId ? `institution/${institutionId}` : "institution";
    await this.patchCall<
      InstitutionContactAPIInDTO | InstitutionProfileAPIInDTO
    >(this.addClientRoot(url), data);
  }

  async getDetail(
    institutionId?: number,
    authHeader?: any,
  ): Promise<InstitutionDetailAPIOutDTO> {
    const url = institutionId ? `institution/${institutionId}` : "institution";
    return this.getCallTyped<InstitutionDetailAPIOutDTO>(
      this.addClientRoot(url),
      authHeader,
    );
  }

  async sync() {
    return this.patchCall(this.addClientRoot("institution/sync"), {});
  }

  async getUserTypeAndRoles(): Promise<InstitutionUserTypeAndRoleAPIOutDTO> {
    return this.getCallTyped<InstitutionUserTypeAndRoleAPIOutDTO>(
      this.addClientRoot("institution/user-types-roles"),
    );
  }

  async getMyInstitutionDetails(
    header?: any,
  ): Promise<InstitutionUserDetailAPIOutDTO> {
    return this.getCallTyped<InstitutionUserDetailAPIOutDTO>(
      this.addClientRoot("institution/my-details"),
      header,
    );
  }

  async getInstitutionTypeOptions(): Promise<OptionItemDto[]> {
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

  async checkIfExist(guid: string, headers: any): Promise<boolean> {
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

  async allInstitutionLocations(
    institutionId?: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    const url = institutionId
      ? `institution/${institutionId}/locations`
      : "institution/locations";
    return this.getCallTyped<InstitutionLocationAPIOutDTO[]>(
      this.addClientRoot(url),
    );
  }

  async getActiveApplicationsSummary(
    locationId: number,
    paginationOptions: PaginationOptions,
    archived: boolean,
  ): Promise<PaginatedResultsAPIOutDTO<ActiveApplicationSummaryAPIOutDTO>> {
    let url = `location/${locationId}/active-applications?archived=${archived}`;

    // Adding pagination params. There is always a default page and pageLimit for paginated APIs.
    url = addPaginationOptions(
      url,
      paginationOptions.page,
      paginationOptions.pageLimit,
      "&",
    );

    //Adding Sort params. There is always a default sortField and sortOrder for Active Applications.
    url = addSortOptions(
      url,
      paginationOptions.sortField,
      paginationOptions.sortOrder,
    );

    // Search criteria is populated only when search box has search text in it.
    if (paginationOptions.searchCriteria) {
      url = `${url}&${PaginationParams.SearchCriteria}=${paginationOptions.searchCriteria}`;
    }

    return this.getCallTyped<
      PaginatedResults<ActiveApplicationSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  async searchInstitutions(
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

  async getBasicInstitutionInfoById(
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
  async institutionUserSummary(
    url: string,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    return this.getCallTyped<PaginatedResults<InstitutionUserAPIOutDTO>>(
      this.addClientRoot(url),
    );
  }

  async getPaginatedAESTInstitutionProgramsSummary(
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

  async getGetAdminRoleOptions(): Promise<UserRoleOptionAPIOutDTO[]> {
    return this.getCallTyped<UserRoleOptionAPIOutDTO[]>(
      this.addClientRoot("institution/admin-roles"),
    );
  }

  /**
   * Get the user status from institution perspective returning the
   * possible user and institution association.
   * @returns information to support the institution login process and
   * the decisions that need happen to complete the process.
   */
  async getInstitutionUserStatus(): Promise<InstitutionUserStatusAPIOutDTO> {
    return this.getCallTyped<InstitutionUserStatusAPIOutDTO>(
      this.addClientRoot("institution/user/status"),
    );
  }
}
