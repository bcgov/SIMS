
export interface ContactInfo {
  addresses: Array<{
    addressLine1: string;
    addressLine2?: string;
    province: string;
    country: string;
    city: string;
    postalCode: string;
  }>;
  phone: string;
}