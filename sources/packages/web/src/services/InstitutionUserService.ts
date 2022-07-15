import {
  InstitutionUserRoles,
  InstitutionUserTypes,
  LocationAuthorization,
  LocationUserAccess,
} from "@/types";
import {
  InstitutionUserViewModel,
  InstitutionUserAndCountForDataTable,
  PaginationOptions,
} from "@/types";
import ApiClient from "@/services/http/ApiClient";
import { AuthService } from "@/services/AuthService";
import {
  InstitutionUserAPIOutDTO,
  CreateInstitutionUserAPIInDTO,
  UpdateInstitutionUserAPIInDTO,
  UserPermissionAPIInDTO,
  InstitutionUserStatusAPIOutDTO,
  InstitutionUserDetailAPIOutDTO,
} from "@/services/http/dto";

export class InstitutionUserService {
  // Share Instance
  private static instance: InstitutionUserService;

  static get shared(): InstitutionUserService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get details of user who is logged in.
   * @returns user details.
   */
  async getMyInstitutionDetails(): Promise<InstitutionUserDetailAPIOutDTO> {
    return ApiClient.InstitutionUserApi.getMyInstitutionDetails();
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
   * Get institution user summary.
   * @param paginationOptions pagination options.
   * @param institutionId institution to be searched. If not
   * provided the institution id will be retrieved from the token,
   * when available.
   * @returns all filtered institution users.
   */
  async institutionUserSummary(
    paginationOptions: PaginationOptions,
    institutionId?: number,
  ): Promise<InstitutionUserAndCountForDataTable> {
    const response = await ApiClient.InstitutionUserApi.searchUsers(
      paginationOptions,
      institutionId,
    );
    return {
      results: this.mapUserRolesAndLocation(response.results),
      count: response.count,
    };
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
   * @param bceidUserId user BCeID id from BCeID Web Service (e.g. SomeUserName)
   * that will have its data retrieved to be created on SIMS.
   * @param isAdmin must be created as an admin user.
   * @param isLegalSigningAuthority for admin users, define if the role
   * legal-signing-authority should be associated with the user.
   * @param locationAuthorizations for non-admin users, the individual permission
   * for every location.
   * @param institutionId institution to have the user associated. If not provided the
   * token information will be used, if available.
   */
  async createInstitutionUserWithAuth(
    bceidUserId: string,
    isAdmin: boolean,
    isLegalSigningAuthority: boolean,
    locationAuthorizations: LocationAuthorization[],
    institutionId?: number,
  ): Promise<void> {
    const userPayload = { bceidUserId } as CreateInstitutionUserAPIInDTO;
    userPayload.permissions = this.createUserPermissions(
      isAdmin,
      isLegalSigningAuthority,
      locationAuthorizations,
    );
    await ApiClient.InstitutionUserApi.createInstitutionUserWithAuth(
      userPayload,
      institutionId,
    );
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
    await ApiClient.InstitutionUserApi.updateInstitutionUserWithAuth(
      userName,
      userPayload,
    );
  }

  /**
   * Get institution user by user name(guid).
   * @param userName user name (guid).
   * @returns institution user details.
   */
  async getInstitutionUserByUserName(
    userName: string,
  ): Promise<InstitutionUserAPIOutDTO> {
    return ApiClient.InstitutionUserApi.getInstitutionUserByUserName(userName);
  }

  /**
   * Update the active status of the user.
   * @param userName unique name of the user to be updated.
   * @param isActive enable or disable the user.
   */
  async updateUserStatus(userName: string, isActive: boolean) {
    return ApiClient.InstitutionUserApi.updateUserStatus(userName, isActive);
  }

  /**
   * Get the user status from institution perspective returning the
   * possible user and institution association.
   * @returns information to support the institution login process and
   * the decisions that need happen to complete the process.
   */
  async getInstitutionUserStatus(): Promise<InstitutionUserStatusAPIOutDTO> {
    return ApiClient.InstitutionUserApi.getInstitutionUserStatus();
  }
}
