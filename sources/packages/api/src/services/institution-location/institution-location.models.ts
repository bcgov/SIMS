import {
  InstitutionLocationInfo,
  PrimaryContact,
} from "../../database/entities";

export interface LocationWithDesignationStatus {
  id: number;
  locationName: string;
  isDesignated: boolean;
  locationAddress?: InstitutionLocationInfo;
  institutionCode?: string;
  primaryContact?: PrimaryContact;
}

/**
 * Service model for institution location.
 */
export interface InstitutionLocationModel {
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
  canadaPostalCode?: string;
  otherPostalCode?: string;
  selectedCountry?: string;
  otherCountry?: string;
}
