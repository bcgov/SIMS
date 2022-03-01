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
  submittedData: any;
  institutionName: string;
  institutionType: string;
  isBCPrivate: boolean;
}

export interface LocationsDesignationsDto {
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
  startDate?: Date;
  endDate?: Date;
}

export interface PendingDesignationDto extends GetDesignationAgreementsDto {
  institutionName: string;
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
