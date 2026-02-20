import {
  DesignationAgreementStatus,
  InstitutionClassification,
  InstitutionMedicalSchoolStatus,
  InstitutionOrganizationStatus,
} from "@/types";
import {
  AddressAPIOutDTO,
  AddressDetailsFormAPIDTO,
} from "@/services/http/dto";
import { Expose } from "class-transformer";

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
  country: string;
  @Expose()
  province?: string;
  @Expose()
  classification: InstitutionClassification;
  @Expose()
  organizationStatus: InstitutionOrganizationStatus;
  @Expose()
  medicalSchoolStatus: InstitutionMedicalSchoolStatus;
}

export interface InstitutionDetailAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: AddressAPIOutDTO;
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  otherRegulatingBody?: string;
  establishedDate: string;
  institutionType: number;
  institutionTypeName: string;
  legalOperatingName: string;
  isBCPrivate: boolean;
  isBCPublic: boolean;
  /**
   * Indicates if the institution has a BCeID business guid
   * associated with, if not it is a basic BCeID institution.
   */
  hasBusinessGuid: boolean;
  country?: string;
  province?: string;
  countryName?: string;
  provinceName?: string;
  classification?: InstitutionClassification;
  organizationStatus?: InstitutionOrganizationStatus;
  medicalSchoolStatus?: InstitutionMedicalSchoolStatus;
}

export interface InstitutionDetailAPIInDTO extends InstitutionProfileAPIInDTO {
  legalOperatingName: string;
  /**
   * @deprecated  Need to be removed.
   * Not removed here as it fails to compile the cypress code.
   */
  formattedEstablishedDate?: string;
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
export class CreateInstitutionAPIInDTO extends InstitutionProfileAPIInDTO {
  @Expose()
  userEmail: string;
}

/**
 * Ministry user institution creation. No user information is provided and
 * user related information (e.g. userEmail) is not needed. Besides that,
 * the Ministry user should be able to provide all data needed to create
 * the institution.
 */
export class AESTCreateInstitutionAPIInDTO extends InstitutionProfileAPIInDTO {
  @Expose()
  legalOperatingName: string;
}
