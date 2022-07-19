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
