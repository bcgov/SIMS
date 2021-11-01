import { InstitutionPrimaryContact } from "../../../types";
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
  institutionCode: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
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
  primaryContact: InstitutionPrimaryContact;
  institution: {
    institutionPrimaryContact: InstitutionPrimaryContact;
  };
}

export interface UserLocationDto {
  id: number;
  name: string;
}

/**
 * This is the object used displaying institution locations summary for an institution
 */
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
