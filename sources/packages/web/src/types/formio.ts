/**
 * FormIO form. Methods available can be checked on
 * https://help.form.io/developers/form-renderer.
 */
export interface FormIOForm {
  data: any;
  checkValidity: (
    data: any,
    dirty: boolean,
    row: any,
    silent: boolean,
  ) => boolean;
}

/**
 * Event args when a Form.IO navigation happen
 * in a Wizard form and the event prevPage
 * and nextPage are triggered.
 */
export interface WizardNavigationEvent {
  page: number;
}

/**
 * Custom event object type.
 */
export interface FormIOCustomEvent {
  type: FormIOCustomEventTypes;
}

/**
 *Enumeration for custom event types emitted from FormIO.
 */
export enum FormIOCustomEventTypes {
  RouteToStudentProfile = "routeToStudentProfile",
  RouteToCreateProgram = "routeToCreateProgram",
  RouteToStartFullTimePartTimeApplication = "routeToStartFullTimePartTimeApplication",
  RouteToContinueApplication = "routeToStudentContinueApplication",
  RouteToConfirmAssessment = "routeToConfirmAssessment",
  RouteToViewStudentApplication = "routeToViewStudentApplication",
  RouteToInstitutionActiveSummaryPage = "routeToInstitutionActiveSummaryPage",
  RouteToParentInformation = "routeToParentInformation",
  RouteToPartnerInformation = "routeToPartnerInformation",
  RouteToProgramInformationRequestSummaryPage = "routeToProgramInformationRequestSummaryPage",
}
