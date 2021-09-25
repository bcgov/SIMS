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
  RouteToContinueApplication = "routeToStudentContinueApplication",
  RouteToConfirmAssessment = "routeToConfirmAssessment",
  RouteToViewStudentApplication = "routeToViewStudentApplication",
}
