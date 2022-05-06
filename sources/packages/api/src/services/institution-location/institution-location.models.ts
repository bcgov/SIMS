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
 * Service model for institution location.
 */
export interface InstitutionLocationModel extends AddressInfo {
  locationName: string;
  institutionCode: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}
