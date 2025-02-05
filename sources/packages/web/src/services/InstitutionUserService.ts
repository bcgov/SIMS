import {
  InstitutionUserRoles,
  InstitutionUserTypes,
  LocationAuthorization,
  LocationUserAccess,
  InstitutionUserViewModel,
  InstitutionUserSummary,
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

  /**
   * Convert the institution user preparing it to be displayed as a summary view.
   * @param institutionUser institution user to be converted.
   * @returns institution user prepared to be displayed on the UI.
   */
  private convertToInstitutionUserViewModel(
    institutionUser: InstitutionUserAPIOutDTO,
  ): InstitutionUserViewModel {
    const roles = institutionUser.authorizations
      .filter((user) => !!user.authType.role)
      .map((user) => user.authType.role);
    const userTypes = institutionUser.authorizations.map(
      (user) => user.authType.type,
    );
    const isAdmin = userTypes.includes(InstitutionUserTypes.admin);
    const userType = isAdmin
      ? InstitutionUserTypes.admin
      : InstitutionUserTypes.user;
    const locations: string[] = [];
    if (isAdmin) {
      locations.push("All");
    } else {
      const locationNames = institutionUser.authorizations
        .filter((authorization) => !!authorization.location)
        .map((authorization) => authorization.location?.name ?? "");
      locations.push(...locationNames);
    }
    return {
      institutionUserId: institutionUser.id,
      email: institutionUser.user.email,
      userName: institutionUser.user.userName,
      displayName: institutionUser.user.userFullName,
      locations,
      userType,
      roles,
      isActive: institutionUser.user.isActive,
      disableRemove:
        AuthService.shared.userToken?.userName ===
        institutionUser.user.userName,
    };
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
  ): Promise<InstitutionUserSummary> {
    const response =
      await ApiClient.InstitutionUserApi.getInstitutionUserSummary(
        paginationOptions,
        institutionId,
      );
    return {
      results: response.results.map((result) =>
        this.convertToInstitutionUserViewModel(result),
      ),
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
   * @return user permissions converted to be sent as API payloads require.
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
            locationAccess.userAccess === LocationUserAccess.User ||
            locationAccess.userAccess === LocationUserAccess.ReadOnlyUser,
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
   * @param institutionUserId institution user id to have the permissions updated.
   * @param isAdmin must be created as an admin user.
   * @param isLegalSigningAuthority for admin users, define if the role
   * legal-signing-authority should be associated with the user.
   * @param locationAuthorizations for non-admin users, the individual permission
   * for every location.
   */
  async updateInstitutionUserWithAuth(
    institutionUserId: number,
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
      institutionUserId,
      userPayload,
    );
  }

  /**
   * Get institution user by institution user id.
   * @param institutionUserId institution user id to have the permissions updated.
   * @returns institution user details.
   */
  async getInstitutionUserById(
    institutionUserId: number,
  ): Promise<InstitutionUserAPIOutDTO> {
    return ApiClient.InstitutionUserApi.getInstitutionUserById(
      institutionUserId,
    );
  }

  /**
   * Update the active status of the user.
   * @param institutionUserId institution user id to have the permissions updated.
   * @param isActive enable or disable the user.
   */
  async updateUserStatus(
    institutionUserId: number,
    isActive: boolean,
  ): Promise<void> {
    return ApiClient.InstitutionUserApi.updateUserStatus(
      institutionUserId,
      isActive,
    );
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

  /**
   * Synchronize the user/institution information from BCeID.
   * Every time that a user login to the system check is some of the readonly
   * information (that must be changed on BCeID) changed.
   */
  async syncBCeIDInformation(): Promise<void> {
    await ApiClient.InstitutionUserApi.syncBCeIDInformation();
  }
}
