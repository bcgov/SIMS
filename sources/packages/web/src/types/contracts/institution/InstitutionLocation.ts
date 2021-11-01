export interface InstitutionAddress {
  address1: string;
  address2?: string;
  city: string;
  country: string;
  postalZipCode: string;
  provinceState: string;
}

export interface InstitutionPrimaryContact {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
}

export interface InstitutionLocation
  extends InstitutionAddress,
    InstitutionPrimaryContact {
  locationName: string;
}
export interface InstitutionLocationData {
  id?: number;
  name: string;
  data: InstitutionAddress;
}
export interface InstitutionLocationsDetails {
  id: number;
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
  primaryContact: InstitutionPrimaryContact;
  institution: {
    institutionPrimaryContact: InstitutionPrimaryContact;
  };
  institutionCode: string;
}
