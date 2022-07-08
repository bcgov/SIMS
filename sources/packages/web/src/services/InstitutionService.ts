import {
  AESTInstitutionProgramsSummaryDto,
  InstitutionUserRoles,
  InstitutionUserTypes,
  LocationAuthorization,
  LocationUserAccess,
  PaginationParams,
} from "@/types";
import {
  InstitutionLocationsDetails,
  InstitutionUserAuthDetails,
  InstitutionUserViewModel,
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
  CreateInstitutionAPIInDTO,
  InstitutionUserTypeAndRoleAPIOutDTO,
  UserRoleOptionAPIOutDTO,
  InstitutionLocationAPIInDTO,
  InstitutionLocationPrimaryContactAPIInDTO,
  AESTCreateInstitutionAPIInDTO,
  PrimaryIdentifierAPIOutDTO,
  InstitutionUserStatusAPIOutDTO,
  CreateInstitutionUserAPIInDTO,
  UpdateInstitutionUserAPIInDTO,
  UserPermissionAPIInDTO,
} from "@/services/http/dto";
import { addPaginationOptions, addSortOptions } from "@/helpers";

export class InstitutionService {
  // Share Instance
  private static instance: InstitutionService;

  public static get shared(): InstitutionService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Create institutions that are not allowed to create the profile by
   * themselves due to limitations, for instance, when the institution
   * has only a basic BCeID login.
   * @param data complete information to create the profile.
   * @return created institution profile.
   */
  async createInstitution(
    data: AESTCreateInstitutionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.Institution.createInstitution(data);
  }

  /**
   * Create institution during institution setup process when the institution
   * profile and the user are create and associated altogether.
   * @param data information from the institution and the user.
   * @return created institution profile.
   */
  async createInstitutionWithAssociatedUser(
    data: CreateInstitutionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.Institution.createInstitutionWithAssociatedUser(data);
  }

  public async updateInstitution(
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
    institutionLocation:
      | InstitutionLocationPrimaryContactAPIInDTO
      | InstitutionLocationAPIInDTO,
  ): Promise<void> {
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
    return ApiClient.Institution.allInstitutionLocations(institutionId);
  }

  mapUserRolesAndLocation(
    response: InstitutionUserAPIOutDTO[],
  ): InstitutionUserViewModel[] {
    return response.map((institutionUser) => {
      const roleArray = institutionUser.authorizations
        .map((auth) => auth.authType.role ?? "")
        .filter((institutionUserRole) => institutionUserRole !== "");
      const role = roleArray.length > 0 ? roleArray.join(" ") : "-";
      const locationArray = institutionUser.authorizations
        .map((auth) => auth.location?.name ?? "")
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
   * To get the institution user summary.
   * @param paginationOptions
   * @param institutionId
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

  /**
   * Create the user authorizations to be associate with the user.
   * @param isAdmin must be created as an admin user.
   * @param isLegalSigningAuthority for admin users, define if the role
   * legal-signing-authority should be associated with the user.
   * @param locationAuthorizations for non-admin users, the individual permission
   * for every location.
   */
  private createUserPermissions(
    isAdmin: boolean,
    isLegalSigningAuthority: boolean,
    locationAuthorizations: LocationAuthorization[],
  ): UserPermissionAPIInDTO[] {
    let permissions: UserPermissionAPIInDTO[];
    if (isAdmin) {
      // User is an admin and will have access for all the locations.
      permissions = [
        {
          userType: InstitutionUserTypes.admin,
          userRole: isLegalSigningAuthority
            ? InstitutionUserRoles.legalSigningAuthority
            : undefined,
        } as UserPermissionAPIInDTO,
      ];
    } else {
      // User is not an admin and will have the permission assigned to the individual locations.
      // Filter locations with access. At this point the UI validations already ensured
      // that there will be at least one location defined with some access level.
      permissions = locationAuthorizations
        .filter(
          (locationAccess) =>
            locationAccess.userAccess === LocationUserAccess.User,
        )
        .map(
          (locationAccess) =>
            ({
              locationId: locationAccess.id,
              userType: locationAccess.userAccess,
            } as UserPermissionAPIInDTO),
        );
    }

    return permissions;
  }

  /**
   * Create a user, associate with the institution, and assign the authorizations.
   * @param userId user BCeID id from BCeID Web Service (e.g. SomeUserName)
   * that will have its data retrieved to be created on SIMS.
   * @param isAdmin must be created as an admin user.
   * @param isLegalSigningAuthority for admin users, define if the role
   * legal-signing-authority should be associated with the user.
   * @param locationAuthorizations for non-admin users, the individual permission
   * for every location.
   */
  async createInstitutionUserWithAuth(
    userId: string,
    isAdmin: boolean,
    isLegalSigningAuthority: boolean,
    locationAuthorizations: LocationAuthorization[],
  ): Promise<void> {
    const userPayload = { userId } as CreateInstitutionUserAPIInDTO;
    userPayload.permissions = this.createUserPermissions(
      isAdmin,
      isLegalSigningAuthority,
      locationAuthorizations,
    );
    await ApiClient.Institution.createInstitutionUserWithAuth(userPayload);
  }

  /**
   * Updates an existing user authorizations.
   * @param userName unique user name from SIMS (e.g. someGuid@bceid).
   * @param isAdmin must be created as an admin user.
   * @param isLegalSigningAuthority for admin users, define if the role
   * legal-signing-authority should be associated with the user.
   * @param locationAuthorizations for non-admin users, the individual permission
   * for every location.
   */
  async updateInstitutionUserWithAuth(
    userName: string,
    isAdmin: boolean,
    isLegalSigningAuthority: boolean,
    locationAuthorizations: LocationAuthorization[],
  ): Promise<void> {
    const userPayload = {} as UpdateInstitutionUserAPIInDTO;
    userPayload.permissions = this.createUserPermissions(
      isAdmin,
      isLegalSigningAuthority,
      locationAuthorizations,
    );
    await ApiClient.Institution.updateInstitutionUserWithAuth(
      userName,
      userPayload,
    );
  }

  public async getInstitutionLocationUserDetails(
    userName: string,
  ): Promise<InstitutionUserAPIOutDTO> {
    return ApiClient.InstitutionLocation.getInstitutionLocationUserDetails(
      userName,
    );
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
    paginationOptions: PaginationOptions,
    archived: boolean,
  ): Promise<PaginatedResults<ActiveApplicationSummaryAPIOutDTO>> {
    return ApiClient.Institution.getActiveApplicationsSummary(
      locationId,
      paginationOptions,
      archived,
    );
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
   * @returns Institution basic information.
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
   * Get the user status from institution perspective returning the
   * possible user and institution association.
   * @returns information to support the institution login process and
   * the decisions that need happen to complete the process.
   */
  async getInstitutionUserStatus(): Promise<InstitutionUserStatusAPIOutDTO> {
    return ApiClient.Institution.getInstitutionUserStatus();
  }
}
