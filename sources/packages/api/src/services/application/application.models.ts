import { Application, StudentAssessment } from "../../database/entities";

export interface ApplicationOverriddenResult {
  overriddenApplication: Application;
  createdApplication: Application;
  createdAssessment: StudentAssessment;
}

export interface ApplicationSubmissionResult {
  application: Application;
  createdAssessment: StudentAssessment;
}

export enum ApplicationSholasticStandingStatus {
  /**
   * The application has been confirmed by the institution.
   */
  Completed = "Completed",
  /**
   * Applications that are available.
   */
  Available = "Available",
  /**
   * Applications that are unavailable.
   */
  Unavailable = "Unavailable",
}
