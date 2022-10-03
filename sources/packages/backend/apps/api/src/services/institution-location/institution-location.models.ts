import {
  PrimaryContact,
  AddressInfo,
  InstitutionLocationData,
} from "@sims/sims-db";

export interface LocationWithDesignationStatus {
  id: number;
  locationName: string;
  isDesignated: boolean;
  locationAddress?: InstitutionLocationData;
  institutionCode?: string;
  primaryContact?: PrimaryContact;
}

/**
 * Service model for AEST user location update.
 */
export interface InstitutionLocationModel extends AddressInfo {
  locationName: string;
  institutionCode: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

/**
 * Service model for Institution user location update.
 */
export interface InstitutionLocationPrimaryContactModel {
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}
