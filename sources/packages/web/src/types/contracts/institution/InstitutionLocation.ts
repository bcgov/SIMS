import {
  InstitutionLocationFormAPIOutDTO,
  DesignationAgreementStatus,
} from "@/services/http/dto";
import { Address, ClientIdType } from "@/types";

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

export interface InstitutionLocationEdit
  extends InstitutionLocationFormAPIOutDTO {
  clientType?: ClientIdType;
}
