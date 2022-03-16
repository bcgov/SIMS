import { ClientIdType } from "../ConfigContract";
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

export interface InstitutionContactDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: InstitutionAddress;
}

export interface InstitutionProfileDTO extends InstitutionContactDTO {
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
 ** This is for view only purpose of Institution not for Update/Create.
 */
export interface InstitutionReadOnlyDTO extends InstitutionProfileDTO {
  legalOperatingName: string;
  formattedEstablishedDate?: string;
  clientType?: ClientIdType;
  institutionTypeName?: string;
  isBCPrivate?: boolean;
}
