import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "../../auth/user-types.enum";

/**
 * Store and provides helper methods to deal with the institution authorizations.
 */
export class InstitutionUserAuthorizations {
  constructor(
    public readonly institutionId: number = 0,
    private readonly authorizations: Authorizations[] = [],
  ) {}

  /**
   * Determines if the admin use type is present.
   * @returns true if admin user type is present.
   */
  isAdmin(): boolean {
    return this.authorizations.some(
      (auth) =>
        auth.locationId === null &&
        auth.userType === InstitutionUserTypes.admin,
    );
  }

  /**
   * Determines if the admin use type is present and
   * it has a specific user role.
   * @param role
   * @returns true if admin role
   */
  hasAdminRole(role: InstitutionUserRoles): boolean {
    return this.authorizations.some(
      (auth) =>
        auth.locationId === null &&
        auth.userType === InstitutionUserTypes.admin &&
        auth.userRole === role,
    );
  }

  /**
   * Determines whether the user is authorized to access
   * a particular location.
   * @param locationId Location to check the permission.
   * @returns true if location access is granted.
   */
  hasLocationAccess(locationId: number): boolean {
    return this.authorizations.some((auth) => auth.locationId === locationId);
  }

  /**
   * Determines whether the user is authorized to access
   * a particular location with a specific user type.
   * @param locationId Location to check the permission.
   * @param userType User type  to check the permission.
   * @returns true if location user type permission is granted.
   */
  hasLocationUserType(
    locationId: number,
    userType: InstitutionUserTypes,
  ): boolean {
    return this.authorizations.some(
      (auth) => auth.locationId === locationId && auth.userType === userType,
    );
  }

  /**
   * Determines whether the user is authorized to access
   * a particular location with a specific user role.
   * @param locationId Location to check the permission.
   * @param userType User role  to check the permission.
   * @returns true if location user role permission is granted.
   */
  hasLocationRole(locationId: number, role: InstitutionUserRoles): boolean {
    return this.authorizations.some(
      (auth) => auth.locationId === locationId && auth.userRole === role,
    );
  }

  /**
   * Gets a list of all location Ids that the user
   * is allowed to access. For admins this list will
   * be empty, what means that all locations are allowed.
   * @returns Allowed locations IDs.
   */
  getLocationsIds(): number[] {
    return this.authorizations
      .filter((auth) => auth.locationId)
      .map((auth) => auth.locationId);
  }
}

export interface Authorizations {
  locationId?: number;
  userType: InstitutionUserTypes;
  userRole: InstitutionUserRoles;
}
