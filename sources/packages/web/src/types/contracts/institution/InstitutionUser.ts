import {
  InstitutionLocationData,
  InstitutionLocationsDetails,
} from "./InstitutionLocation";
import { InstitutionDto } from "./CreateInstitutionDto";
export interface InstitutionUserResDto {
  id: number;
  user: InstitutionUserDetails;
  authorizations: {
    id: number;
    authType: {
      role?: string;
      type: string;
    };
    location?: {
      name: string;
    };
  }[];
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
  active: boolean;
  id: number;
  role: string;
  type: string;
}
export interface InstitutionAuth {
  id?: number;
  authType: InstitutionAuthType;
  location?: InstitutionLocationData;
}

export interface InstitutionUserDetails {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  userName: string;
  isActive: boolean;
}
export interface InstitutionLocationUserAuthDto {
  id: number;
  authorizations: InstitutionAuth[];
  institution: InstitutionDto;
  user: InstitutionUserDetails;
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

export interface UserAuth {
  name?: string;
  code: string;
  id?: string;
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
}

export interface LocationStateForStore {
  id: number;
  name: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    province: string;
    country: string;
    city: string;
    postalCode: string;
  };
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
export interface InstitutionUserAndCount {
  users: InstitutionUserResDto[];
  totalUsers: number;
}

export interface InstitutionUserAndCountForDataTable {
  users: InstitutionUserViewModel[];
  totalUsers: number;
}

export enum InstitutionUserRoles {
  legalSigningAuthority = "legal-signing-authority",
  primaryContact = "primary-contact",
}

export const LEGAL_SIGNING_AUTHORITY_EXIST = "LEGAL_SIGNING_AUTHORITY_EXIST";
export const LEGAL_SIGNING_AUTHORITY_MSG =
  "Legal signing authority already exists for this Institution.";
