import { DesignationAgreementStatus } from "../../../database/entities";

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
  locationData: any;
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
  institutionName: string;
}

export interface UpdateDesignationLocationDto {
  designationLocationId?: number;
  locationId: number;
  approved: boolean;
}

export interface UpdateDesignationDto {
  institutionId: number;
  designationStatus: DesignationAgreementStatus;
  startDate?: Date;
  endDate?: Date;
  locationsDesignations?: UpdateDesignationLocationDto[];
  note: string;
}
