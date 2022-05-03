export interface AddressAPIDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceState?: string;
  country: string;
  postalCode: string;
}

export interface ContactInformationAPIDTO {
  address: AddressAPIDTO;
  phone: string;
}
