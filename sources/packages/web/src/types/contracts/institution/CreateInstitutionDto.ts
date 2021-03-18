export interface CreateInstitutionDto {
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
}
