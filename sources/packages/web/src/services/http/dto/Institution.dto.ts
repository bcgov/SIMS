import { ClientIdType, DesignationAgreementStatus } from "@/types";
import {
  AddressAPIOutDTO,
  AddressDetailsFormAPIDTO,
} from "@/services/http/dto";

export interface InstitutionContactAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: AddressAPIOutDTO;
}

export interface InstitutionContactAPIInDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: AddressDetailsFormAPIDTO;
}

export interface InstitutionProfileAPIOutDTO
  extends InstitutionContactAPIOutDTO {
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  establishedDate: Date;
  institutionType: number;
}

export interface InstitutionProfileAPIInDTO extends InstitutionContactAPIInDTO {
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  establishedDate: Date;
  institutionType: number;
}

export interface InstitutionDetailAPIOutDTO
  extends InstitutionProfileAPIOutDTO {
  legalOperatingName: string;
  formattedEstablishedDate?: string;
  institutionTypeName?: string;
  isBCPrivate?: boolean;
  clientType?: ClientIdType;
  /**
   * Indicates if the institution has a BCeID business guid
   * associated with, if not it is a basic BCeID institution.
   */
  hasBusinessGuid: boolean;
}

export interface InstitutionDetailAPIInDTO extends InstitutionProfileAPIInDTO {
  legalOperatingName: string;
  formattedEstablishedDate?: string;
  institutionTypeName?: string;
  isBCPrivate?: boolean;
}
export interface InstitutionUserAuthTypeAPIOutDTO {
  role: string;
  type: string;
}

export interface InstitutionLocationAuthDataAPIOutDTO {
  address: AddressAPIOutDTO;
}

export interface InstitutionAuthLocationAPIOutDTO {
  id: number;
  name: string;
  data: InstitutionLocationAuthDataAPIOutDTO;
}

export interface InstitutionUserAuthAPIOutDTO {
  id?: number;
  authType: InstitutionUserAuthTypeAPIOutDTO;
  location?: InstitutionAuthLocationAPIOutDTO;
}

export interface InstitutionUserSummaryAPIOutDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  isActive: boolean;
  userFullName?: string;
}

export interface InstitutionUserAPIOutDTO {
  id: number;
  user: InstitutionUserSummaryAPIOutDTO;
  authorizations: InstitutionUserAuthAPIOutDTO[];
}

export interface SearchInstitutionAPIOutDTO {
  id: number;
  legalName: string;
  operatingName: string;
  address: AddressAPIOutDTO;
}

export interface InstitutionBasicAPIOutDTO {
  operatingName: string;
  designationStatus: DesignationAgreementStatus;
  /**
   * Indicates if the institution has a BCeID business guid
   * associated with, if not it is a basic BCeID institution.
   */
  hasBusinessGuid: boolean;
}

/**
 * DTO for institution creation by the institution user during the on board process
 * when the institution profile and the admin user must be created altogether.
 */
export interface CreateInstitutionAPIInDTO {
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
  mailingAddress: AddressDetailsFormAPIDTO;
}

/**
 * Ministry user institution creation. No user information is provided and
 * user related information (e.g. userEmail) is not needed. Besides that,
 * the Ministry user should be able to provide all data needed to create
 * the institution.
 */
export interface AESTCreateInstitutionAPIInDTO
  extends Omit<CreateInstitutionAPIInDTO, "userEmail"> {
  legalOperatingName: string;
}

export interface InstitutionUserTypeAndRoleAPIOutDTO {
  userTypes: string[];
  userRoles: string[];
}

export interface UserPermissionAPIInDTO {
  locationId?: number;
  userType?: string;
  userRole?: string;
}

/**
 * Associates a new user from BCeID with an institution
 * associating also the authorizations.
 */
export interface CreateInstitutionUserAPIInDTO {
  /**
   * User BCeID id from BCeID Web Service (e.g. SomeUserName) that will have its
   * data retrieved to be created on SIMS.
   */
  userId: string;
  /**
   * Permissions to be associated with the new user.
   */
  permissions: UserPermissionAPIInDTO[];
}

/**
 * Update an existing user association with an institution
 * changing the authorizations.
 */
export type UpdateInstitutionUserAPIInDTO = Omit<
  CreateInstitutionUserAPIInDTO,
  "userId"
>;

export interface UserActiveStatusAPIInDTO {
  isActive: boolean;
}

export interface InstitutionLocationAuthAPIOutDTO {
  locationId: number;
  userType: string;
  userRole: string;
}

export interface UserAuthDetailAPIOutDTO {
  institutionId: number;
  authorizations: InstitutionLocationAuthAPIOutDTO[];
}
export interface InstitutionUserDetailAPIOutDTO {
  id?: number;
  user: InstitutionUserSummaryAPIOutDTO;
  authorizations: UserAuthDetailAPIOutDTO;
}

export interface InstitutionUserLocationsAPIOutDTO {
  id: number;
  name: string;
  address: AddressAPIOutDTO;
}

export interface UserRoleOptionAPIOutDTO {
  name: string;
  code: string;
  id?: number;
}

export interface InstitutionUserStatusAPIOutDTO {
  /**
   * Indicates if the user is present on DB or not.
   * A user that is not present on a existing institution means that
   * the user never got access to this institution.
   * A user not present associated on BCeID to an institution that is also
   * not present means that the institution must be created, what can be done
   * by a business BCeID user or by the Ministry for a basic BCeID.
   */
  isExistingUser: boolean;
  /**
   * Case the user is present indicate if the the same is active.
   */
  isActiveUser?: boolean;
  /**
   * Indicates if the user belongs to a institution already present on DB.
   * The user can be not present on DB but its institution can be already present,
   * what means that the user does not have access to the solution.
   * Case the user is not present and the institution is not present it means
   * that the institution can be created if the user has a business BCeID account,
   * otherwise the institution must be created in advance by the Ministry.
   * !Returned only when isExistingUser is false to support the login process.
   */
  associatedInstitutionExists?: boolean;
  /**
   * Indicates if the user is a business BCeID.
   * !Returned only when isExistingUser is false to support the login process.
   */
  hasBusinessBCeIDAccount?: boolean;
}
