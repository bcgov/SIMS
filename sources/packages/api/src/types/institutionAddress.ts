export interface InstitutionAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
  canadaPostalCode?: string;
  otherPostalCode?: string;
  selectedCountry?: string;
  otherCountry?: string;
}
