import { Address } from "../Common";
import { InstitutionLocationsDetails } from "./InstitutionLocation";

export enum InstitutionUserTypes {
  admin = "admin",
  user = "user",
}

export enum InstitutionUserRoles {
  legalSigningAuthority = "legal-signing-authority",
}

export interface InstitutionUserViewModel {
  id: number;
  email: string;
  userName: string;
  displayName: string;
  location: string[];
  userType: string[];
  role: string;
  isActive: boolean;
  disableRemove?: boolean;
}

export interface InstitutionAuthType {
  role: string;
  type: string;
}
export interface InstitutionUserRoleLocation {
  locationId?: number;
  userType?: string;
}
export interface InstitutionUserDto {
  userId?: string;
  permissions: UserPermissionDto[];
}

export interface UserPermissionDto extends InstitutionUserRoleLocation {
  userId?: string;
  userRole?: string;
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
  userType: string;
}
export interface UserStateForStore {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    isAdmin: boolean;
  };
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
  /**
   * Indicates if the institution has a BCeID business guid
   * associated with, if not it is a basic BCeID institution.
   */
  hasBusinessGuid: boolean;
}

export interface LocationStateForStore {
  id: number;
  name: string;
  address: Address;
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

export interface InstitutionUserAndCountForDataTable {
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
