export interface AddressInfo {
  addressLine1: string;
  addressLine2?: string;
  province?: string;
  country: string;
  city: string;
  postalCode: string;
  selectedCountry?: string;
}
export interface ContactInfo {
  addresses: Array<AddressInfo>;
  phone: string;
}
