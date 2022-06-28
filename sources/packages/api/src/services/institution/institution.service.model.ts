import { AddressInfo } from "../../database/entities";

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
  mailingAddress: AddressInfo;
}

export interface InstitutionFormModel extends AddressInfo {
  /**
   * Optional for institutions authenticated using a business BCeID when
   * the name will be retrieved from BCeID Web Service directly.
   * For institutions created by the Ministry the name will be provided
   * by the user creating the institution profile.
   */
  legalOperatingName?: string;
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
