export interface Institutionlocation {
  address1: string;
  address2?: string;
  city: string;
  country: string;
  locationName: string;
  postalZipCode: string;
  provinceState: string;
}
export interface InstitutionlocationData {
  name: string;
  data: {
    address1: string;
    address2?: string;
    city: string;
    provinceState: string;
    postalZipCode: string;
    country: string;
  };
}
