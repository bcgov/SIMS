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

/** Read only DTO which represents the institution profile
 ** This DTO is shared between ministry and Institution.
 */
export interface InstitutionProfileDto extends InstitutionDto {
  legalOperatingName: string;
}
