import { Application, StudentAssessment } from "../../database/entities";

export interface ApplicationOverriddenResult {
  overriddenApplication: Application;
  createdApplication: Application;
  createdAssessment: StudentAssessment;
}

export interface ApplicationSubmissionResult {
  application: Application;
  assessment: StudentAssessment;
}
