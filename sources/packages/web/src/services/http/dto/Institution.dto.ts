import {
  Address,
  AddressInfo,
  ClientIdType,
  DesignationAgreementStatus,
} from "@/types";

export interface InstitutionContactAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: Address;
}

export interface InstitutionContactAPIInDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: Address;
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
}

export interface InstitutionDetailAPIInDTO extends InstitutionProfileAPIInDTO {
  legalOperatingName: string;
  formattedEstablishedDate?: string;
  institutionTypeName?: string;
  isBCPrivate?: boolean;
}
export interface InstitutionUserAuthTypeOutDTO {
  role: string;
  type: string;
}

export interface InstitutionLocationAuthDataAPIOutDTO {
  address: AddressInfo;
}

export interface InstitutionAuthLocationOutDTO {
  id: number;
  name: string;
  data: InstitutionLocationAuthDataAPIOutDTO;
}

export interface InstitutionUserAuthOutDTO {
  id?: number;
  authType: InstitutionUserAuthTypeOutDTO;
  location?: InstitutionAuthLocationOutDTO;
}

export interface InstitutionUserSummaryOutDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  isActive: boolean;
}

export interface InstitutionUserAPIOutDTO {
  id: number;
  user: InstitutionUserSummaryOutDTO;
  authorizations: InstitutionUserAuthOutDTO[];
}

export interface SearchInstitutionAPIOutDTO {
  id: number;
  legalName: string;
  operatingName: string;
  address: Address;
}

export interface InstitutionBasicAPIOutDTO {
  operatingName: string;
  designationStatus: DesignationAgreementStatus;
}

export interface InstitutionFormAPIInDTO {
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

export interface InstitutionUserTypeAndRoleAPIOutDTO {
  userTypes: string[];
  userRoles: string[];
}

export interface UserPermissionAPIInDTO {
  locationId?: number;
  userType?: string;
  userRole?: string;
}

export interface InstitutionUserAPIInDTO {
  userId?: string;
  permissions: UserPermissionAPIInDTO[];
}
