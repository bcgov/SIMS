import { InstitutionLocationInfo } from "./Common";

export interface SubmitDesignationAgreementDto {
  dynamicData: any;
  locations: SubmittedLocationsDto[];
}

export interface SubmittedLocationsDto {
  locationId: number;
  requestForDesignation: boolean;
}

export interface GetDesignationAgreementDto {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  locationsDesignations: LocationsDesignationsDto[];
  startDate: Date;
  endDate: Date;
  submittedData: any;
  institutionId: number;
  institutionName: string;
  institutionType: string;
  isBCPrivate: boolean;
}

export interface LocationsDesignationsDto {
  designationLocationId?: number;
  locationId: number;
  locationName: string;
  locationData: InstitutionLocationInfo;
  requested: boolean;
  approved: boolean;
}

export interface GetDesignationAgreementsDto {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  submittedDate: Date;
  startDate?: Date;
  endDate?: Date;
}

export interface PendingDesignationDto extends GetDesignationAgreementsDto {
  legalOperatingName: string;
}

/**
 * Possible status for a designation agreement.
 */
export enum DesignationAgreementStatus {
  /**
   * The designation agreement was submitted by the institution and
   * it is still pending to the Ministry approve or decline.
   */
  Pending = "Pending",
  /**
   * The designation agreement previously submitted by the institution
   * was approved by the Ministry.
   */
  Approved = "Approved",
  /**
   * The designation agreement previously submitted by the institution
   * was declined by the Ministry.
   */
  Declined = "Declined",
}

export interface UpdateDesignationLocationDto {
  locationId: number;
  locationName: string;
  locationAddress: string;
  approved: boolean;
  existingDesignationLocation: boolean;
}
/**
 * DTO Object to Approve/Deny a designation agreement.
 * startDate, endDate and locationsDesignations used only for approval.
 */
export interface UpdateDesignationDto {
  designationStatus: DesignationAgreementStatus;
  startDate?: Date;
  endDate?: Date;
  locationsDesignations?: UpdateDesignationLocationDto[];
  note: string;
}
