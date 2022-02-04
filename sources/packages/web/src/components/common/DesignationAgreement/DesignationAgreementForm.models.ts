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
}

export interface DesignationModel {
  institutionName: string;
  institutionType: string;
  locations: DesignationLocationsListItem[];
  // The form will contain more dynamic data that what
  // is declared below. The declared data is part of the
  // dynamic but it need be provided to the form when the
  // form is in submission mode.
  dynamicData: {
    legalAuthorityName: string;
    legalAuthorityEmailAddress: string;
  };
  viewMode: DesignationFormViewModes;
  // Non BC Privates will have less information
  // displayed on the form.
  isBCPrivate: boolean;
}
