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

export interface ContactInformationAPIOutDTO {
  address: AddressAPIOutDTO;
  phone: string;
}
