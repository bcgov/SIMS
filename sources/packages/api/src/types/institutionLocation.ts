export interface ValidatedInstitutionLocation {
  data: {
    locationName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    provinceState: string;
    postalCode: string;
    country: string;
    institutionCode: string;
    primaryContactFirstName: string;
    primaryContactLastName: string;
    primaryContactEmail: string;
    primaryContactPhone: string;
  };
}
