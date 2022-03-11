import { Address, ApprovalStatus } from "..";

export interface Institute {
  name: string;
  code?: string;
}

export interface BasicInstitutionInfo {
  operatingName: string;
}

/**
 * Interface for Institution search API response
 */
export interface SearchInstitutionResp {
  id: number;
  legalName: string;
  operatingName: string;
  address: Address;
}

export interface AESTInstitutionDetailDto {
  legalOperatingName: string;
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  formattedEstablishedDate: string;
  regulatingBody: string;
  establishedDate: string;
  // Primary Contact
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;

  address: Address;
  institutionTypeName: string;
}

export interface AESTInstitutionProgramsSummaryDto {
  programId: number;
  programName: string;
  submittedDate: Date;
  locationName: string;
  programStatus: ApprovalStatus;
  totalOfferings: number;
  formattedSubmittedDate: string;
  locationId: number;
}
