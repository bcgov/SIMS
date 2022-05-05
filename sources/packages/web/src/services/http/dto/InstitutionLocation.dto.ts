import { AddressAPIOutDTO, DesignationAgreementStatus } from "@/types";
import {
  InstitutionPrimaryContactAPIOutDTO,
  AddressDetailsFormAPIDTO,
} from "@/services/http/dto";

export interface InstitutionLocationFormAPIInDTO
  extends AddressDetailsFormAPIDTO {
  locationName: string;
  institutionCode: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

export interface InstitutionLocationFormAPIOutDTO
  extends AddressDetailsFormAPIDTO {
  locationName: string;
  institutionCode: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

export interface InstitutionLocationAPIOutDTO {
  id: number;
  name: string;
  data: {
    address: AddressAPIOutDTO;
  };
  primaryContact: InstitutionPrimaryContactAPIOutDTO;
  institutionCode: string;
  designationStatus: DesignationAgreementStatus;
}

export interface ActiveApplicationDataAPIOutDTO {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: string;
  applicationOfferingEndDate: string;
  applicationStudentName: string;
  applicationNumber: string;
  applicationLocationName: string;
  applicationStatus: string;
}

export interface ActiveApplicationSummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  applicationStatus: string;
  fullName: string;
}
