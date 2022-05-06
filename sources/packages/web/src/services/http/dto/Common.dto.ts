export interface OptionItemAPIOutDTO {
  id: number;
  description: string;
}

export interface InstitutionPrimaryContactAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
}

/**
 * Common DTO for address details.
 * IN/OUT is not specified for this DTO, because it is
 * a generic address interface that is used extend or used as nested type
 * for both IN and OUT DTOs
 */
export interface AddressDetailsFormAPIDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode: string;
  provinceState?: string;
  canadaPostalCode?: string;
  otherPostalCode?: string;
  selectedCountry?: string;
  otherCountry?: string;
}
