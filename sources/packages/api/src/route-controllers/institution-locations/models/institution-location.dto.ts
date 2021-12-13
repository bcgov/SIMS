import { InstitutionPrimaryContact } from "../../../types";
import { InstitutionLocationInfo } from "../../../database/entities/institution-location.model";

export class GetInstitutionLocationDto {
  id: number;
  data: InstitutionLocationInfo;
  name: string;
}
/**
 * Interface which defines the contract of how institution location data is passed to form.io
 */
export interface InstitutionLocationTypeDto {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  locationName: string;
  postalCode: string;
  provinceState: string;
  institutionCode: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

/**
 * Interface which defines the contract of how institution location data is passed to Vue component
 */
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
  primaryContact: InstitutionPrimaryContact;
  institution: {
    institutionPrimaryContact: InstitutionPrimaryContact;
  };
  institutionCode: string;
}

export interface UserLocationDto {
  id: number;
  name: string;
}

export interface InstitutionLocationsSummaryDto {
  id: number;
  name: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    province: string;
    country: string;
    city: string;
    postalCode: string;
  };
}
