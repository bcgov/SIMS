export interface ValidatedInstitutionLocation {
  data: {
    locationName: string;
    address1: string;
    address2?: string;
    city: string;
    provinceState: string;
    postalZipCode: string;
    country: string;
  };
}
export interface InstitutionLocationsDetails {
  name: string;
  data: {
    address: {
      addressLine1: string;
      addressLine2?: string;
      province: string;
      country: string;
      city: string;
      postalCode: string;
    };
  };
  institution: {
    institutionPrimaryContact : {
      primaryContactEmail: string;
      primaryContactFirstName: string;
      primaryContactLastName: string;
      primaryContactPhone: string;
    };
  };
}
