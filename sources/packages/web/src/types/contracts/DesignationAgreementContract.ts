import { InstitutionLocationData } from "./institutionLocationContract";

export interface SubmitDesignationAgreementAPIInDTO {
  dynamicData: any;
  locations: SubmittedLocationsAPIInDTO[];
}

export interface SubmittedLocationsAPIInDTO {
  locationId: number;
  requestForDesignation: boolean;
}

export interface DesignationAgreementAPIOutDTO {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  locationsDesignations: LocationDesignationAPIOutDTO[];
  startDate: string;
  endDate: string;
  submittedData: any;
  institutionId: number;
  institutionName: string;
  institutionType: string;
  isBCPrivate: boolean;
}

export interface LocationDesignationAPIOutDTO {
  designationLocationId?: number;
  locationId: number;
  locationName: string;
  locationData: InstitutionLocationData;
  requested: boolean;
  approved: boolean;
}

export interface DesignationAgreementDetailsAPIOutDTO {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  submittedDate: Date;
  startDate?: string;
  endDate?: string;
}

export interface PendingDesignationAgreementDetailsAPIOutDTO
  extends DesignationAgreementDetailsAPIOutDTO {
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

export interface DesignationLocationAPIInDTO {
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
export interface UpdateDesignationDetailsAPIInDTO {
  designationStatus: DesignationAgreementStatus;
  startDate?: string;
  endDate?: string;
  locationsDesignations?: DesignationLocationAPIInDTO[];
  note: string;
}
