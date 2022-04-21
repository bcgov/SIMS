export interface InstitutionAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}
export interface UpdateInstitution {
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  establishedDate: Date;
  institutionType: number;
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: InstitutionAddress;
}

export interface InstitutionFormModel {
  userEmail: string;
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  establishedDate: Date;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
  institutionType: number;
}

export interface InstitutionUserModel {
  userId: string;
  permissions: UserPermissionModel[];
}

export interface UserPermissionModel {
  locationId?: number;
  userType: string;
  userRole?: string;
}

export interface InstitutionUserPermissionModel {
  permissions: UserPermissionModel[];
}

export interface InstitutionUserTypeAndRoleModel {
  userTypes: string[];
  userRoles: string[];
}
