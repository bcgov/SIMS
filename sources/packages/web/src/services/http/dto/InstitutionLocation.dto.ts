import {
  AddressInfo,
  DesignationAgreementStatus,
  InstitutionPrimaryContact,
} from "@/types";

export interface InstitutionLocationFormAPIInDTO {
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
}

export interface InstitutionLocationFormAPIOutDTO {
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
}

export interface InstitutionLocationAPIOutDTO {
  id: number;
  name: string;
  data: {
    address: AddressInfo;
  };
  primaryContact: InstitutionPrimaryContact;
  institution: {
    institutionPrimaryContact: InstitutionPrimaryContact;
  };
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
