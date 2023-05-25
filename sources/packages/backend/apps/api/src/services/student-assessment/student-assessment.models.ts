import { StudentAssessment, StudentAssessmentStatus } from "@sims/sims-db";

/**
 * Service model to fetch Assessment History.
 */
export interface AssessmentHistory extends StudentAssessment {
  status: StudentAssessmentStatus;
}
