import { StudentAssessment } from "../../database/entities";

export enum StudentAssessmentStatus {
  Submitted = "Submitted",
  InProgress = "In Progress",
  Completed = "Completed",
}

/**
 * Service model to fetch Assessment History.
 */
export interface AssessmentHistory extends StudentAssessment {
  status: StudentAssessmentStatus;
}
