import { DesignationAgreementStatus } from "@/services/http/dto";

/**
 * Used do define conditions to change the form.io, for instance,
 * some components visibility.
 */
export enum DesignationFormViewModes {
  submission = "submission",
  viewOnly = "viewOnly",
}

/**
 * Locations list that will be displayed to the
 * user mark the required locations to be designated
 * and also display the approved ones when the
 * form is in viewOnly mode.
 */
export interface DesignationLocationsListItem {
  locationId: number;
  locationName: string;
  locationAddress: string;
  requestForDesignation: boolean;
  approvedForDesignation: boolean;
}

/**
 * Main model to populate all information needed
 * for the designation agreement.
 */
export interface DesignationModel {
  institutionName: string;
  institutionType: string;
  locations: DesignationLocationsListItem[];
  // The form will contain more dynamic data that what
  // is declared below. The declared data is part of the
  // dynamic but it need be provided to the form when the
  // form is in submission mode.
  dynamicData?: {
    legalAuthorityName: string;
    legalAuthorityEmailAddress: string;
  };
  viewMode: DesignationFormViewModes;
  // Non BC Privates will have less information
  // displayed on the form.
  isBCPrivate: boolean;
  designationStatus?: DesignationAgreementStatus;
  designationStatusClass?: string;
  disableLinkNavigation?: boolean;
}

/**
 * Details for approve or update an approved designation agreement.
 */
export interface UpdateDesignationDetailsModel {
  designationStatus: DesignationAgreementStatus;
  startDate?: string;
  endDate?: string;
  locationsDesignations?: UpdateDesignationLocationsListItem[];
  note: string;
  existingDesignationLocation: boolean;
}

/**
 * Location item for a designation approval or an update for
 * an approved designation.
 */
export interface UpdateDesignationLocationsListItem {
  locationId: number;
  locationName: string;
  locationAddress: string;
  requestForDesignation: boolean;
  approvedForDesignation?: boolean;
  approved: boolean;
  existingDesignationLocation: boolean;
}
