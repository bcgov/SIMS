import { InstitutionLocationInfo } from "../../../database/entities/institution-location.model";

export class GetInstitutionLocationDto {
  id: number;
  data: InstitutionLocationInfo;
  name: string;
}

export interface InstitutionLocationTypeDto {
  address1: string;
  address2?: string;
  city: string;
  country: string;
  locationName: string;
  postalZipCode: string;
  provinceState: string;
}

export interface InstitutionLocationsDetailsDto {
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
  institution: {
    institutionPrimaryContact: {
      primaryContactEmail: string;
      primaryContactFirstName: string;
      primaryContactLastName: string;
      primaryContactPhone: string;
    };
  };
}

export interface UserLocationDto {
  id: number;
  name: string;
}
