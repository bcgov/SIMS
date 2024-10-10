import {
  ApplicationScholasticStandingStatus,
  DesignationAgreementStatus,
} from "@/types";
import {
  InstitutionPrimaryContactAPIOutDTO,
  AddressDetailsFormAPIDTO,
  AddressAPIOutDTO,
} from "@/services/http/dto";
import { Expose } from "class-transformer";

export class InstitutionLocationFormAPIInDTO extends AddressDetailsFormAPIDTO {
  @Expose()
  locationName: string;
  @Expose()
  institutionCode: string;
  @Expose()
  primaryContactFirstName: string;
  @Expose()
  primaryContactLastName: string;
  @Expose()
  primaryContactEmail: string;
  @Expose()
  primaryContactPhone: string;
}

export class InstitutionLocationPrimaryContactAPIInDTO {
  @Expose()
  primaryContactFirstName: string;
  @Expose()
  primaryContactLastName: string;
  @Expose()
  primaryContactEmail: string;
  @Expose()
  primaryContactPhone: string;
}

export class InstitutionLocationAPIInDTO
  implements
    AddressDetailsFormAPIDTO,
    InstitutionLocationPrimaryContactAPIInDTO
{
  @Expose()
  locationName: string;
  @Expose()
  institutionCode: string;
  // From InstitutionLocationPrimaryContactAPIInDTO.
  @Expose()
  primaryContactFirstName: string;
  @Expose()
  primaryContactLastName: string;
  @Expose()
  primaryContactEmail: string;
  @Expose()
  primaryContactPhone: string;
  // From InstitutionLocationPrimaryContactAPIInDTO.
  @Expose()
  addressLine1: string;
  @Expose()
  addressLine2?: string;
  @Expose()
  city: string;
  @Expose()
  country: string;
  @Expose()
  postalCode: string;
  @Expose()
  provinceState?: string;
  @Expose()
  canadaPostalCode?: string;
  @Expose()
  otherPostalCode?: string;
  @Expose()
  selectedCountry?: string;
  @Expose()
  otherCountry?: string;
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

/**
 * Interface for study break item.
 */
export interface StudyBreak {
  breakStartDate: string;
  breakEndDate: string;
}

export interface ActiveApplicationDataAPIOutDTO {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: string;
  applicationOfferingEndDate: string;
  studyStartDate?: string;
  studyEndDate?: string;
  applicationStudentName: string;
  applicationNumber: string;
  applicationLocationName: string;
  applicationStatus: string;
  applicationOfferingStudyBreak: StudyBreak[];
}

export interface ActiveApplicationSummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  applicationStatus: string;
  fullName: string;
  scholasticStandingId?: number;
  applicationScholasticStandingStatus: ApplicationScholasticStandingStatus;
}

export interface InstitutionLocationsAPIOutDTO {
  id: number;
  name: string;
}
