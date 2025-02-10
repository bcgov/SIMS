import { InstitutionLocationsDetails } from "./InstitutionLocation";

export enum InstitutionUserTypes {
  admin = "admin",
  user = "user",
  readOnlyUser = "read-only-user",
}

export enum InstitutionUserRoles {
  legalSigningAuthority = "legal-signing-authority",
}

export interface InstitutionUserViewModel {
  institutionUserId: number;
  email: string;
  userName: string;
  displayName: string;
  locations: string[];
  userType: string;
  roles: string[];
  isActive: boolean;
  disableRemove: boolean;
}

export interface InstitutionAuthType {
  role: string;
  type: string;
}
export interface InstitutionUserRoleLocation {
  locationId?: number;
  userType?: string;
}

export interface InstitutionUserWithUserType
  extends InstitutionLocationsDetails {
  userType?: {
    name?: string;
    code?: string;
  };
}

export interface InstitutionUserAuthDetails {
  userType?: string;
  userRole?: string;
  location?: InstitutionUserRoleLocation[];
  userGuid?: string;
  userId?: string;
}

export interface InstitutionUserAuthRolesAndLocation {
  locationId?: number;
  userRole?: string;
  userType: InstitutionUserTypes;
}
export interface UserStateForStore {
  email: string;
  firstName: string;
  lastName: string;
  userFullName: string;
  isActive: boolean;
  isAdmin: boolean;
  /**
   * If the bceid authenticated user is not an existing sims user
   * then it is assumed that the user has logged in to setup institution
   * and they are identified as institution set up user in route context.
   */
  isInstitutionSetupUser?: boolean;
}
export interface AuthorizationsForStore {
  institutionId: number;
  authorizations: InstitutionUserAuthRolesAndLocation[];
}

export interface InstitutionStateForStore {
  legalOperatingName: string;
  operatingName: string;
  institutionType: string;
  isBCPrivate: boolean;
  isBCPublic: boolean;
  /**
   * Indicates if the institution has a BCeID business guid
   * associated with, if not it is a basic BCeID institution.
   */
  hasBusinessGuid: boolean;
}

export interface LocationStateForStore {
  id: number;
  name: string;
}

export interface InstitutionUserAndAuthDetailsForStore {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    userFullName: string;
    isActive: boolean;
    isAdmin: boolean;
  };
  authorizations: AuthorizationsForStore;
}

export interface InstitutionUserSummary {
  results: InstitutionUserViewModel[];
  count: number;
}

/**
 * BCeID user key-value-pair for display name and user name value.
 */
export interface BCeIDUser {
  value: string;
  title: string;
}

/**
 * Represents the possible location user access
 * available on the institution user manager.
 */
export enum LocationUserAccess {
  User = "user",
  NoAccess = "none",
  ReadOnlyUser = "read-only-user",
}

/**
 * Represents the locations and the user access for every
 * institution location on the institution user manager.
 */
export interface LocationAuthorization {
  id: number;
  name: string;
  address: string;
  userAccess: LocationUserAccess;
}

/**
 * Model used for manage users creation and edit.
 * Allow the authorization configuration for the
 * institution users.
 */
export class UserManagementModel {
  selectedBCeIDUser = "";
  isAdmin = false;
  isLegalSigningAuthority = false;
  locationAuthorizations = [] as LocationAuthorization[];
}
