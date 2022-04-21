import { ClientIdType, DesignationAgreementStatus } from "@/types";
import {
  AddressAPIInDTO,
  AddressAPIOutDTO,
  AddressInfoAPIOutDTO,
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
  mailingAddress: AddressAPIInDTO;
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
export interface InstitutionUserAuthTypeAPIOutDTO {
  role: string;
  type: string;
}

export interface InstitutionLocationAuthDataAPIOutDTO {
  address: AddressInfoAPIOutDTO;
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
  addressLine2?: string;
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
  address: AddressInfoAPIOutDTO;
}

export interface UserRoleOptionAPIOutDTO {
  name: string;
  code: string;
  id?: number;
}
