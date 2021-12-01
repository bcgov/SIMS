import { Address } from "..";

export interface Institute {
  name: string;
  code?: string;
}

export interface BasicInstitutionInfo {
  operatingName: string;
}

/**
 * Interface for Institution search API response
 */
export interface SearchInstitutionResp {
  id: number;
  legalName: string;
  operatingName: string;
  address: Address;
}

export interface AESTInstitutionDetailDto {
  legalOperatingName: string;
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  formattedEstablishedDate: string;
  regulatingBody: string;
  establishedDate: string;
  // Primary Contact
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  // Legal Authority Contact
  legalAuthorityEmail: string;
  legalAuthorityFirstName: string;
  legalAuthorityLastName: string;
  legalAuthorityPhone: string;
  address: Address;
  institutionTypeName: string;
}
