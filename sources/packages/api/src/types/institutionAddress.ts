export interface InstitutionAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceState?: string;
  country: string;
  postalCode: string;
  selectedCountry?: string;
}
