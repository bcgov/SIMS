export interface LocationWithDesignationStatus {
  id?: number;
  locationName: string;
  isDesignated: boolean;
  locationAddress?: AddressData;
  institutionCode?: string;
  primaryContact?: PrimaryContact;
}
interface PrimaryContact {
  email: string;
  lastName: string;
  firstName: string;
  phoneNumber: string;
}

interface AddressData {
  address: LocationAddress;
}
interface LocationAddress {
  city: string;
  country: string;
  province: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
}
