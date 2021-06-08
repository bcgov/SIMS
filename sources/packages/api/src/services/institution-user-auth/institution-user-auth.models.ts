import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "../../auth/user-types.enum";

export class InstitutionUserAuthorizations {
  constructor(private readonly authorizations: Authorizations[] = []) {}

  isAdmin(): boolean {
    return this.authorizations.some(
      (auth) =>
        auth.locationId === null &&
        auth.userType === InstitutionUserTypes.admin,
    );
  }

  hasAdminRole(role: InstitutionUserRoles): boolean {
    return this.authorizations.some(
      (auth) =>
        auth.locationId === null &&
        auth.userType === InstitutionUserTypes.admin &&
        auth.userRole === role,
    );
  }

  hasLocationAccess(locationId: number): boolean {
    return this.authorizations.some((auth) => auth.locationId === locationId);
  }

  hasLocationUserType(
    locationId: number,
    userType: InstitutionUserTypes,
  ): boolean {
    return this.authorizations.some(
      (auth) => auth.locationId === locationId && auth.userType === userType,
    );
  }

  hasLocationRole(locationId: number, role: InstitutionUserRoles): boolean {
    return this.authorizations.some(
      (auth) => auth.locationId === locationId && auth.userRole === role,
    );
  }

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
