import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "../../auth/user-types.enum";

/**
 * Store and provides helper methods to deal with the institution authorizations.
 */
export class InstitutionUserAuthorizations {
  public adminLocationsIds: number[] = [];

  constructor(
    public readonly institutionId: number = 0,
    public readonly authorizations: Authorizations[] = [],
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
   * Determines if the admin user type is present and
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
   * Institution Admins will always have full access.
   * @param locationId Location to check the permission.
   * @returns true if location access is granted or
   * if the user is an Institution Admin.
   */
  hasLocationAccess(locationId: number): boolean {
    if (this.isAdmin()) {
      return this.adminLocationsIds.includes(locationId);
    }

    return this.authorizations.some((auth) => auth.locationId === locationId);
  }

  /**
   * Determines whether the user is authorized to access
   * a particular location with a specific user type.
   * Institution Admins will always have full access.
   * @param locationId Location to check the permission.
   * @param userType User type  to check the permission.
   * @returns true if location user type permission is granted.
   */
  hasLocationUserType(
    locationId: number,
    userType: InstitutionUserTypes,
  ): boolean {
    if (this.isAdmin()) {
      return this.adminLocationsIds.includes(locationId);
    }

    return this.authorizations.some(
      (auth) => auth.locationId === locationId && auth.userType === userType,
    );
  }

  /**
   * Determines whether the user is authorized to access
   * a particular location with a specific user role.
   * Institution Admins will always have full access.
   * @param locationId Location to check the permission.
   * @param userType User role  to check the permission.
   * @returns true if location user role permission is granted.
   */
  hasLocationRole(locationId: number, role: InstitutionUserRoles): boolean {
    if (this.isAdmin()) {
      return this.adminLocationsIds.includes(locationId);
    }

    return this.authorizations.some(
      (auth) => auth.locationId === locationId && auth.userRole === role,
    );
  }

  /**
   * Gets a list of all location Ids that the user
   * is allowed to access. For admins, this list will
   * contains all the location IDs for the institution.
   * @returns Allowed locations IDs.
   */
  getLocationsIds(): number[] {
    if (this.isAdmin()) {
      return this.adminLocationsIds;
    }

    return this.authorizations
      .filter((auth) => auth.locationId)
      .map((auth) => auth.locationId);
  }

  /**
   * Determines whether the user has a user type associated with any location.
   * @param userType User type to check the permission.
   * @returns true if the user type is present at any location the user is associated with.
   */
  hasUserTypeAtAnyLocation(institutionUserType: InstitutionUserTypes): boolean {
    if (this.isAdmin()) {
      return true;
    }
    return this.authorizations.some(
      (auth) => auth.userType === institutionUserType,
    );
  }
}

export interface Authorizations {
  locationId?: number;
  userType: InstitutionUserTypes;
  userRole: InstitutionUserRoles;
}
