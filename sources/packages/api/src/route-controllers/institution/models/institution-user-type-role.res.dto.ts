export interface InstitutionUserTypeAndRoleResponseDto {
  userTypes: string[];
  userRoles: string[];
}

export interface InstitutionUserPermissionDto {
  permissions: {
    userType: string;
    locationId: number;
    userRole?: string;
  }[];
}
/**
 * DTO To load the admin roles dropdown component
 */
export interface UserRoleOptionDTO {
  name: string;
  code: string;
}
