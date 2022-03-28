import { Address, ApprovalStatus, DesignationAgreementStatus } from "..";

export interface Institute {
  name: string;
  code?: string;
}

export interface BasicInstitutionInfo {
  operatingName: string;
  designationStatus: DesignationAgreementStatus;
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
