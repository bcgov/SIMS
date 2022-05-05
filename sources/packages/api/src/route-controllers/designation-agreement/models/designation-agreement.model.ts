import {
  DesignationAgreementStatus,
  InstitutionLocationInfo,
} from "../../../database/entities";

/**
 * This DTO contains dynamic data that must
 * be validated by the form.io dryrun validation.
 */
export interface SubmitDesignationAgreementDto {
  dynamicData: any;
  locations: SubmittedLocationsDto[];
}

/**
 * This DTO contains dynamic data that must
 * be validated by the form.io dryrun validation.
 */
export interface SubmittedLocationsDto {
  locationId: number;
  requestForDesignation: boolean;
}

export interface GetDesignationAgreementDto {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  locationsDesignations: LocationsDesignationsDto[];
  submittedData: any;
  startDate: Date;
  endDate: Date;
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
  approved?: boolean;
}

export interface GetDesignationAgreementsDto {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  submittedDate: Date;
  startDate?: string;
  endDate?: string;
}

export interface PendingDesignationDto extends GetDesignationAgreementsDto {
  legalOperatingName: string;
}

export interface UpdateDesignationLocation {
  locationId: number;
  approved: boolean;
}
/**
 * DTO Object to Approve/Deny a designation agreement.
 * startDate, endDate and locationsDesignations used only for approval.
 */
export interface UpdateDesignationDto {
  designationStatus: DesignationAgreementStatus;
  startDate?: Date;
  endDate?: Date;
  locationsDesignations?: UpdateDesignationLocation[];
  note: string;
}

/**
 * startDate, endDate and locationsDesignations used only for approval.
 */
export interface UpdateDesignation {
  designationStatus: DesignationAgreementStatus;
  startDate?: Date;
  endDate?: Date;
  locationsDesignations?: UpdateDesignationLocation[];
  note: string;
}
