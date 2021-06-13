export interface InstitutionUserTypeAndRoleResponseDto {
  userTypes: string[];
  userRoles: string[];
}
export interface InstitutionUserAuthRolesAndLocation {
  locationId?: number;
  userRole?: string;
  userType: string;
}
