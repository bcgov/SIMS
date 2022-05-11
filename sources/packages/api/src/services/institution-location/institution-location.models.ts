import { PrimaryContact } from "src/database/entities/primary-contact.type";
import { AddressInfo, InstitutionLocationData } from "../../database/entities";

export interface LocationWithDesignationStatus {
  id: number;
  locationName: string;
  isDesignated: boolean;
  locationAddress?: InstitutionLocationData;
  institutionCode?: string;
  primaryContact?: PrimaryContact;
}

/**
 * Service model for institution location for AEST and create.
 */
export interface InstitutionLocationModel extends AddressInfo {
  locationName: string;
  institutionCode: string;
  primaryContactFirstName?: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

/**
 * Service model for Institutions Institution location edit.
 */
export interface InstitutionLocationPrimaryContactModel {
  primaryContactFirstName?: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}
