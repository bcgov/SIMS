import { AssessmentTriggerType } from "../../database/entities";

export enum StudentAssessmentStatus {
  Submitted = "Submitted",
  InProgress = "In Progress",
  Completed = "Completed",
}

/**
 * Service model to fetch Assessment History.
 */
export interface AssessmentHistory {
  submittedDate: Date;
  triggerType: AssessmentTriggerType;
  assessmentDate: Date;
  status: StudentAssessmentStatus;
}
