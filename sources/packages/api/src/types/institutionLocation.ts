export interface ValidatedInstitutionLocation {
  data: {
    locationName: string;
    address1: string;
    address2?: string;
    city: string;
    provinceState: string;
    postalZipCode: string;
    country: string;
    institutionCode: string;
    primaryContactFirstName: string;
    primaryContactLastName: string;
    primaryContactEmail: string;
    primaryContactPhone: string;
  };
}
