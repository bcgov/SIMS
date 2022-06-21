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

export enum ApplicationScholasticStandingStatus {
  /**
   * Applications that are archived and have a scholastic standing associated with.
   */
  Completed = "Completed",
  /**
   * Applications that are not archived yet and are available to have a change reported (scholastic standing).
   */
  Available = "Available",
  /**
   * Applications that are archived and no longer can have a change reported (scholastic standing).
   */
  Unavailable = "Unavailable",
}
