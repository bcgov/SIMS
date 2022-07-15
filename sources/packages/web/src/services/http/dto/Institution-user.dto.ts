import { AddressAPIOutDTO } from "@/services/http/dto";

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
  userFullName: string;
}

export interface InstitutionUserAPIOutDTO {
  id: number;
  user: InstitutionUserSummaryAPIOutDTO;
  authorizations: InstitutionUserAuthAPIOutDTO[];
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
  bceidUserId: string;
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
  user: InstitutionUserSummaryAPIOutDTO;
  authorizations: UserAuthDetailAPIOutDTO;
}

export interface InstitutionUserStatusAPIOutDTO {
  /**
   * Indicates if the user is present on DB or not.
   * A user that is not present on an existing institution means that
   * the user never got access to this institution.
   * A user not present associated on BCeID to an institution that is also
   * not present means that the institution must be created, what can be done
   * by a business BCeID user or by the Ministry for a basic BCeID.
   */
  isExistingUser: boolean;
  /**
   * Case the user is present indicate if the same is active.
   */
  isActiveUser?: boolean;
  /**
   * Indicates if the user belongs to an institution already present on DB.
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
