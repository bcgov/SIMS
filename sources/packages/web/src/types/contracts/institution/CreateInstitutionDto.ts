import { ClientTypeBaseRoute } from "../ConfigContract";
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

export interface InstitutionAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export interface InstitutionContactDto {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: InstitutionAddress;
}

export interface InstitutionProfileDto extends InstitutionContactDto {
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  establishedDate: Date;
  institutionType: number;
}

/** Read only DTO which represents the institution profile
 ** This DTO is shared between ministry and Institution.
 */
export interface InstitutionReadOnlyDto extends InstitutionProfileDto {
  legalOperatingName: string;
  formattedEstablishedDate?: string;
  clientType: ClientTypeBaseRoute;
  institutionTypeName?: string;
  isBCPrivate?: boolean;
}
