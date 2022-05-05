export interface OptionItemAPIOutDTO {
  id: number;
  description: string;
}

/**
 * Common DTO for Address.
 ** This DTO is returned as API response body.
 */
export interface AddressAPIOutDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceState?: string;
  country: string;
  postalCode: string;
}

export interface InstitutionPrimaryContactAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
}

/**
 * Common DTO for address details.
 */ export interface AddressDetailsFormAPIDTO {
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
