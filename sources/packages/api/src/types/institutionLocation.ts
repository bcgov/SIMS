export interface InstitutionLocationType {
  address1: string;
  address2?: string;
  applicationId: string;
  city: string;
  country: string;
  locationName: string;
  postalZipCode: string;
  provinceState: string;
  submit: boolean;
}

export interface ValidatedInstitutionLocation {
  data: {
    locationName: string,
    address1: string,
    address2?: string,
    city: string,
    provinceState: string,
    postalZipCode: string,
    country: string,
    applicationId: string,
    pid: string,
    process_pid: string,
  }
}