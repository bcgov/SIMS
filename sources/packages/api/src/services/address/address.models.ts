/**
 * Service model for address details.
 */
export interface AddressDetailsModel {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode: string;
  provinceState?: string;
  selectedCountry?: string;
}
