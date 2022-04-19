export class InstitutionUserTypeAndRoleAPIOutDTO {
  userTypes: string[];
  userRoles: string[];
}

/**
 * DTO To load the admin roles dropdown component
 */
export class UserRoleOptionDTO {
  name: string;
  code: string;
}
