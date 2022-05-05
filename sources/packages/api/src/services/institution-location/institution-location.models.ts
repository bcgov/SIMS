import { PrimaryContact } from "../../types";
import { InstitutionLocationInfo } from "../../database/entities";
import { AddressDetailsModel } from "../address/address.models";

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
export interface InstitutionLocationModel extends AddressDetailsModel {
  locationName: string;
  institutionCode: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}
