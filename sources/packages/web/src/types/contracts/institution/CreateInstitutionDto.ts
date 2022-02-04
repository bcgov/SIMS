import { BCeIDDetailsDto } from "../UserContract";
/**
 * DTO for institution creation/retrieval.
 */
export interface InstitutionDto {
  userEmail: string;
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  establishedDate: Date;
  // Primary Contact
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  // Legal Authority Contact
  legalAuthorityFirstName: string;
  legalAuthorityLastName: string;
  legalAuthorityEmail: string;
  legalAuthorityPhone: string;
  // Primary address
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
  institutionType: number;
  institutionTypeName?: string;
}

export interface UpdateInstitutionDto extends Partial<InstitutionDto> {
  id?: number;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  legalOperatingName?: string;
}

export interface InstitutionDetailDto {
  institution: UpdateInstitutionDto;
  account: BCeIDDetailsDto;
  isBCPrivate: boolean;
}
