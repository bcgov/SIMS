import {
  Institute,
  AESTInstitutionProgramsSummaryDto,
  PaginationParams,
} from "@/types";
import {
  EducationProgram,
  InstitutionLocationsDetails,
  InstitutionUserAuthDetails,
  InstitutionUserViewModel,
  UserPermissionDto,
  InstitutionUserRoleLocation,
  InstitutionUserWithUserType,
  OptionItemDto,
  DataTableSortOrder,
  InstitutionUserAndCountForDataTable,
  PaginatedResults,
  PaginationOptions,
} from "../types";
import ApiClient from "./http/ApiClient";
import { AuthService } from "./AuthService";
import {
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
  InstitutionLocationAPIOutDTO,
  ActiveApplicationDataAPIOutDTO,
  ActiveApplicationSummaryAPIOutDTO,
  InstitutionDetailAPIOutDTO,
  InstitutionContactAPIInDTO,
  InstitutionUserAPIOutDTO,
  SearchInstitutionAPIOutDTO,
  InstitutionBasicAPIOutDTO,
  InstitutionFormAPIInDTO,
  InstitutionUserTypeAndRoleAPIOutDTO,
  InstitutionUserAPIInDTO,
  UserRoleOptionAPIOutDTO,
  ScholasticStandingDataAPIInDTO,
} from "@/services/http/dto";
import { addPaginationOptions, addSortOptions } from "@/helpers";

export class InstitutionService {
  // Share Instance
  private static instance: InstitutionService;

  public static get shared(): InstitutionService {
    return this.instance || (this.instance = new this());
  }

  public async getInstitutes(): Promise<Institute[]> {
    // TODO: Sending dummy list for now later replace with API call
    const institutes: Institute[] = [
      {
        name: "Sprott Shaw College",
        code: "ssc",
      },
    ];
    return institutes;
  }

  public async getProgramsFor(
    institute?: Institute,
  ): Promise<EducationProgram[]> {
    if (institute?.code === "ssc") {
      const programs: EducationProgram[] = [
        {
          name: "Nursing Program",
          code: "np",
        },
      ];
      return programs;
    }
    return [];
  }

  public async createInstitution(data: InstitutionFormAPIInDTO): Promise<void> {
    await ApiClient.Institution.createInstitution(data);
  }

  public async updateInstitute(
    data: InstitutionContactAPIInDTO,
    institutionId?: number,
  ): Promise<void> {
    await ApiClient.Institution.updateInstitution(data, institutionId);
  }

  public async getDetail(
    institutionId?: number,
    authHeader?: any,
  ): Promise<InstitutionDetailAPIOutDTO> {
    return ApiClient.Institution.getDetail(institutionId, authHeader);
  }

  public async sync() {
    return ApiClient.Institution.sync();
  }

  public async createInstitutionLocation(
    data: InstitutionLocationFormAPIInDTO,
  ) {
    await ApiClient.InstitutionLocation.createInstitutionLocation(data);
  }

  public async updateInstitutionLocation(
    locationId: number,
    institutionLocation: InstitutionLocationFormAPIInDTO,
  ) {
    await ApiClient.InstitutionLocation.updateInstitutionLocation(
      locationId,
      institutionLocation,
    );
  }

  public async getInstitutionLocation(
    locationId: number,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    return ApiClient.InstitutionLocation.getInstitutionLocation(locationId);
  }

  public async getAllInstitutionLocations(
    institutionId?: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    return ApiClient.InstitutionLocation.allInstitutionLocations(institutionId);
  }

  mapUserRolesAndLocation(
    response: InstitutionUserAPIOutDTO[],
  ): InstitutionUserViewModel[] {
    return response.map((institutionUser) => {
      const roleArray = institutionUser.authorizations
        .map((auth) => auth.authType.role || "")
        .filter((institutionUserRole) => institutionUserRole !== "");
      const role = roleArray.length > 0 ? roleArray.join(" ") : "-";
      const locationArray = institutionUser.authorizations
        .map((auth) => auth.location?.name || "")
        .filter((loc) => loc !== "");
      const userType = institutionUser.authorizations.map(
        (auth) => auth.authType.type,
      );
      const location = userType.includes("admin")
        ? ["All"]
        : locationArray.length > 0
        ? locationArray
        : [];

      const viewModel: InstitutionUserViewModel = {
        id: institutionUser.id,
        displayName: `${institutionUser.user.firstName} ${institutionUser.user.lastName}`,
        email: institutionUser.user.email,
        userName: institutionUser.user.userName,
        userType,
        role,
        location,
        isActive: institutionUser.user.isActive,
        disableRemove:
          AuthService.shared.userToken?.userName ===
          institutionUser.user.userName,
      };

      return viewModel;
    });
  }

  /**
   * To get the institution user summary
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param searchName, user's name keyword to be searched
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns All the institution users.
   */
  public async institutionUserSummary(
    paginationOptions: PaginationOptions,
    institutionId?: number,
  ): Promise<InstitutionUserAndCountForDataTable> {
    let url = institutionId
      ? `institution/${institutionId}/user`
      : "institution/user";
    url = addPaginationOptions(
      url,
      paginationOptions.page,
      paginationOptions.pageLimit,
      "?",
    );
    url = addSortOptions(
      url,
      paginationOptions.sortField,
      paginationOptions.sortOrder,
    );

    if (paginationOptions.searchCriteria) {
      url = `${url}&${PaginationParams.SearchCriteria}=${paginationOptions.searchCriteria}`;
    }
    const response: PaginatedResults<InstitutionUserAPIOutDTO> =
      await ApiClient.Institution.institutionUserSummary(url);
    return {
      results: this.mapUserRolesAndLocation(response.results),
      count: response.count,
    };
  }

  public async getUserTypeAndRoles(): Promise<InstitutionUserTypeAndRoleAPIOutDTO> {
    return ApiClient.Institution.getUserTypeAndRoles();
  }

  private async prepareUserPayload(
    isNew: boolean,
    data: InstitutionUserAuthDetails,
  ) {
    const payload = {} as InstitutionUserAPIInDTO;
    if (isNew) {
      payload.userId = data.userId;
    }

    if (data.location) {
      // Add locations specific permissions.
      payload.permissions = data.location.map(
        (permission: InstitutionUserRoleLocation) =>
          ({
            userType: permission.userType,
            locationId: permission.locationId,
          } as UserPermissionDto),
      );
    } else {
      // Add institution specific permissions.
      payload.permissions = [
        {
          userType: data.userType,
          userRole: data.userRole === "admin" ? undefined : data.userRole,
        },
      ];
    }
    return payload;
  }

  public async createUser(data: InstitutionUserAuthDetails): Promise<void> {
    const payload = await this.prepareUserPayload(true, data);
    await ApiClient.InstitutionLocation.createUser(payload);
  }

  public async getInstitutionLocationUserDetails(
    userName: string,
  ): Promise<InstitutionUserAPIOutDTO> {
    return ApiClient.InstitutionLocation.getInstitutionLocationUserDetails(
      userName,
    );
  }

  public async updateUser(
    userName: string,
    data: InstitutionUserAuthDetails,
  ): Promise<void> {
    const payload = await this.prepareUserPayload(false, data);
    await ApiClient.InstitutionLocation.updateUser(userName, payload);
  }

  public async updateUserStatus(userName: string, userStatus: boolean) {
    return ApiClient.InstitutionLocation.updateUserStatus(userName, userStatus);
  }

  public async prepareAddUserPayload(
    isAdmin: boolean,
    selectUser: UserRoleOptionAPIOutDTO,
    adminRole: string,
    institutionLocationList: InstitutionLocationsDetails[],
  ) {
    return {
      userId: selectUser.code,
      userType: isAdmin ? "admin" : undefined,
      userRole: isAdmin ? adminRole : undefined,
      userGuid: selectUser.id,
      location: !isAdmin
        ? (institutionLocationList
            .map((el: InstitutionUserWithUserType) => {
              if (el.userType?.code) {
                return {
                  locationId: el.id,
                  userType: el.userType?.code,
                };
              }
            })
            .filter((el: any) => el) as InstitutionUserRoleLocation[])
        : undefined,
    } as InstitutionUserAuthDetails;
  }

  public async prepareEditUserPayload(
    institutionUserName: string,
    isAdmin: boolean,
    adminRole: string,
    institutionLocationList: InstitutionUserWithUserType[],
  ) {
    return {
      userGuid: institutionUserName ? institutionUserName : undefined,
      userType: isAdmin ? "admin" : undefined,
      userRole: isAdmin ? adminRole : undefined,
      location: !isAdmin
        ? (institutionLocationList
            .map((el: InstitutionUserWithUserType) => {
              if (el.userType?.code) {
                return {
                  locationId: el?.id,
                  userType: el.userType?.code,
                };
              }
            })
            .filter((el: any) => el) as InstitutionUserRoleLocation[])
        : undefined,
    } as InstitutionUserAuthDetails;
  }

  public async getMyInstitutionDetails(authHeader?: any) {
    return ApiClient.Institution.getMyInstitutionDetails(authHeader);
  }

  public async getMyInstitutionLocationsDetails(authHeader?: any) {
    return ApiClient.InstitutionLocation.getMyInstitutionLocationsDetails(
      authHeader,
    );
  }

  public async getLocationsOptionsList(): Promise<OptionItemDto[]> {
    return ApiClient.InstitutionLocation.getOptionsList();
  }

  public async getInstitutionTypeOptions(): Promise<OptionItemDto[]> {
    return ApiClient.Institution.getInstitutionTypeOptions();
  }

  public async checkIfExist(guid: string, headers: any): Promise<boolean> {
    return ApiClient.Institution.checkIfExist(guid, headers);
  }

  public async getActiveApplicationsSummary(
    locationId: number,
  ): Promise<ActiveApplicationSummaryAPIOutDTO[]> {
    return ApiClient.Institution.getActiveApplicationsSummary(locationId);
  }

  public async getActiveApplication(
    applicationId: number,
    locationId: number,
  ): Promise<ActiveApplicationDataAPIOutDTO> {
    return ApiClient.InstitutionLocation.getActiveApplication(
      applicationId,
      locationId,
    );
  }

  /**
   * Search Institution for ministry search page.
   * @param legalName
   * @param operatingName
   * @returns Institution search result(s).
   */
  async searchInstitutions(
    legalName: string,
    operatingName: string,
  ): Promise<SearchInstitutionAPIOutDTO[]> {
    return ApiClient.Institution.searchInstitutions(legalName, operatingName);
  }

  /**
   * Get the Basic information of the institution for the ministry institution detail page header
   * @param institutionId
   * @returns BasicInstitutionInfo
   */
  async getBasicInstitutionInfoById(
    institutionId: number,
  ): Promise<InstitutionBasicAPIOutDTO> {
    return ApiClient.Institution.getBasicInstitutionInfoById(institutionId);
  }

  /**
   * Get the Institution programs summary for the ministry institution detail page
   * @param institutionId
   * @returns PaginatedResults<AESTInstitutionProgramsSummaryDto>
   */
  async getPaginatedAESTInstitutionProgramsSummary(
    institutionId: number,
    pageSize: number,
    page: number,
    searchCriteria: string,
    sortColumn?: string,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<AESTInstitutionProgramsSummaryDto>> {
    return ApiClient.Institution.getPaginatedAESTInstitutionProgramsSummary(
      institutionId,
      pageSize,
      page,
      searchCriteria,
      sortColumn,
      sortOrder,
    );
  }

  public async getGetAdminRoleOptions(): Promise<UserRoleOptionAPIOutDTO[]> {
    return ApiClient.Institution.getGetAdminRoleOptions();
  }

  /**
   * Save scholastic standing and create new assessment.
   * @param applicationId application id
   * @param locationId location id
   * @param payload scholasticStanding payload
   */
  async saveScholasticStanding(
    applicationId: number,
    locationId: number,
    payload: ScholasticStandingDataAPIInDTO,
  ): Promise<void> {
    await ApiClient.InstitutionLocation.saveScholasticStanding(
      applicationId,
      locationId,
      payload,
    );
  }
}
