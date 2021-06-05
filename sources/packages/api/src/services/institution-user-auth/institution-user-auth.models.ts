import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "../../auth/user-types.enum";

export class InstitutionUserAuthorizations {
  constructor(
    public readonly isAdmin: boolean,
    private readonly authorizations: LocationAuthorizations[] = [],
  ) {}

  hasLocationAccess(locationId: number): boolean {
    return this.authorizations.some((auth) => auth.locationId === locationId);
  }

  hasUserType(locationId: number, userType: InstitutionUserTypes): boolean {
    return this.authorizations.some(
      (auth) => auth.locationId === locationId && auth.userType === userType,
    );
  }

  hasRole(locationId: number, role: InstitutionUserRoles): boolean {
    return this.authorizations.some(
      (auth) => auth.locationId === locationId && auth.userRole === role,
    );
  }
}

export interface LocationAuthorizations {
  locationId: number;
  userType: InstitutionUserTypes;
  userRole: InstitutionUserRoles;
}
