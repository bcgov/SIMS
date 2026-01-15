import { ClientIdType, DesignationAgreementStatus } from "@/types";
import {
  AddressAPIOutDTO,
  AddressDetailsFormAPIDTO,
} from "@/services/http/dto";
import { Expose } from "class-transformer";

export interface InstitutionContactAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: AddressAPIOutDTO;
}

export class InstitutionContactAPIInDTO {
  @Expose()
  primaryContactEmail: string;
  @Expose()
  primaryContactFirstName: string;
  @Expose()
  primaryContactLastName: string;
  @Expose()
  primaryContactPhone: string;
  @Expose()
  mailingAddress: AddressDetailsFormAPIDTO;
}

export interface InstitutionProfileAPIOutDTO
  extends InstitutionContactAPIOutDTO {
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  otherRegulatingBody?: string;
  establishedDate: string;
  institutionType: number;
}

export class InstitutionProfileAPIInDTO extends InstitutionContactAPIInDTO {
  @Expose()
  operatingName: string;
  @Expose()
  primaryPhone: string;
  @Expose()
  primaryEmail: string;
  @Expose()
  website: string;
  @Expose()
  regulatingBody: string;
  @Expose()
  otherRegulatingBody?: string;
  @Expose()
  establishedDate: Date;
  @Expose()
  institutionType: number;
}

export interface InstitutionDetailAPIOutDTO
  extends InstitutionProfileAPIOutDTO {
  legalOperatingName: string;
  /**
   * @deprecated  Need to be removed.
   * Not removed here as it fails to compile the cypress code.
   */
  formattedEstablishedDate?: string;
  institutionTypeName?: string;
  isBCPrivate?: boolean;
  isBCPublic?: boolean;
  clientType?: ClientIdType;
  /**
   * Indicates if the institution has a BCeID business guid
   * associated with, if not it is a basic BCeID institution.
   */
  hasBusinessGuid: boolean;
}

export interface InstitutionDetailAPIInDTO extends InstitutionProfileAPIInDTO {
  legalOperatingName: string;
  /**
   * @deprecated  Need to be removed.
   * Not removed here as it fails to compile the cypress code.
   */
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
  hasRestrictions: boolean;
}

export class CreateInstitution {
  @Expose()
  operatingName: string;
  @Expose()
  primaryPhone: string;
  @Expose()
  primaryEmail: string;
  @Expose()
  website: string;
  @Expose()
  regulatingBody: string;
  @Expose()
  otherRegulatingBody?: string;
  @Expose()
  establishedDate: string;
  @Expose()
  primaryContactFirstName: string;
  @Expose()
  primaryContactLastName: string;
  @Expose()
  primaryContactEmail: string;
  @Expose()
  primaryContactPhone: string;
  @Expose()
  institutionType: number;
  @Expose()
  mailingAddress: AddressDetailsFormAPIDTO;
}

/**
 * DTO for institution creation by the institution user during the on board process
 * when the institution profile and the admin user must be created altogether.
 */
export class CreateInstitutionAPIInDTO extends CreateInstitution {
  @Expose()
  userEmail: string;
}

/**
 * Ministry user institution creation. No user information is provided and
 * user related information (e.g. userEmail) is not needed. Besides that,
 * the Ministry user should be able to provide all data needed to create
 * the institution.
 */
export class AESTCreateInstitutionAPIInDTO extends CreateInstitution {
  @Expose()
  legalOperatingName: string;
}
