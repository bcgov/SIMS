import { Address } from "@/types";
import { DesignationAgreementStatus } from "../DesignationAgreementContract";

export interface InstitutionPrimaryContact {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
}

/**
 * TODO: This DTO has to be deleted when institution user APIs are refactored.
 * DTO for institution location Vue
 */
export interface InstitutionLocationsDetails {
  id: number;
  name: string;
  data: {
    address: Address;
  };
  primaryContact: InstitutionPrimaryContact;
  institution: {
    institutionPrimaryContact: InstitutionPrimaryContact;
  };
  institutionCode: string;
  designationStatus: DesignationAgreementStatus;
}
