import { Address } from "@/types";
import { DesignationAgreementStatus } from "../DesignationAgreementContract";

export interface InstitutionPrimaryContact {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
}
/**
 * DTO for institution location form.io
 */
export interface InstitutionLocation
  extends Address,
    InstitutionPrimaryContact {
  locationName: string;
}
export interface InstitutionLocationData {
  id?: number;
  name: string;
  data: Address;
}
/**
 * DTO for institution location Vue
 */
export interface InstitutionLocationsDetails {
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
  designationStatus: DesignationAgreementStatus;
}
