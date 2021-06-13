import {
  InstitutionlocationData,
  InstitutionLocationsDetails,
} from "./AddInstitutionLocation";
import { InstitutionDto } from "./CreateInstitutionDto";
import { InstitutionUserAuthRolesAndLocation } from "./InstitutionUserTypeAndRoleResponseDto";
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
  location: string;
  userType: string;
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
  authType?: InstitutionAuthType;
  location?: InstitutionlocationData;
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
  location?: InstitutionUserRoleLocation[];
  userGuid?: string;
  userId?: string;
}

export interface InstitutionUserAuthorizationsDetails {
  institutionId: number;
  authorizations: InstitutionUserAuthRolesAndLocation[];
}
export interface InstitutionUserAndAuthDetails {
  user: InstitutionUserDetails;
  authorizations: InstitutionUserAuthorizationsDetails;
}
