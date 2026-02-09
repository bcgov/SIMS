import {
  AddressInfo,
  InstitutionClassification,
  InstitutionMedicalSchoolStatus,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

export interface UpdateInstitution {
  operatingName?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  website?: string;
  regulatingBody?: string;
  otherRegulatingBody?: string;
  establishedDate?: string;
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: AddressInfo;
  country?: string;
  province?: string;
  classification?: InstitutionClassification;
  organizationStatus?: InstitutionOrganizationStatus;
  medicalSchoolStatus?: InstitutionMedicalSchoolStatus;
}

export interface InstitutionFormModel {
  /**
   * Optional for institutions authenticated using a business BCeID when
   * the name will be retrieved from BCeID Web Service directly.
   * For institutions created by the Ministry the name will be provided
   * by the Ministry user creating the institution profile.
   */
  legalOperatingName?: string;
  /**
   * Optional when creating the institution that is not associated with
   * a user initially, for instance, when Ministry is creating the institution
   * on behalf of an institution that is not allowed to do it.
   */
  userEmail?: string;
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  otherRegulatingBody?: string;
  establishedDate: string;
  country: string;
  province?: string;
  classification: InstitutionClassification;
  organizationStatus: InstitutionOrganizationStatus;
  medicalSchoolStatus: InstitutionMedicalSchoolStatus;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  mailingAddress: AddressInfo;
}

/**
 * Associates a new user from BCeID with an institution
 * associating also the authorizations.
 */
export interface InstitutionUserModel {
  /**
   * User BCeID id from BCeID Web Service (e.g. SomeUserName) that will have its
   * data retrieved to be created on SIMS.
   */
  bceidUserId: string;
  /**
   * Permissions to be associated with the new user.
   */
  permissions: UserPermissionModel[];
}

export interface UserPermissionModel {
  locationId?: number;
  userType: string;
  userRole?: string;
}

export interface InstitutionUserTypeAndRoleModel {
  userTypes: string[];
  userRoles: string[];
}
