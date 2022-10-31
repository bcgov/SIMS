/**
 * FormIO form. Methods available can be checked on
 * https://help.form.io/developers/form-renderer.
 */
export interface FormIOForm<T = unknown> {
  data: T;
  checkValidity: (
    data: any,
    dirty: boolean,
    row: unknown,
    silent: boolean,
  ) => boolean;
  submit: () => any;
  submission: unknown;
  options: FormIOFormOptions;
  on: (
    event: string,
    callback: (page: WizardNavigationEvent, index: number) => void,
  ) => unknown;
  isLastPage: () => boolean;
  prevPage: () => WizardNavigationEvent;
  nextPage: () => WizardNavigationEvent;
  page: WizardNavigationEvent;
}

/**
 * Options object type.
 */
export interface FormIOFormOptions {
  buttonSettings: FormIOFormOptionsButtonSettings;
}

/**
 * ButtonSettings object type.
 */
export interface FormIOFormOptionsButtonSettings {
  showSubmit: boolean;
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
