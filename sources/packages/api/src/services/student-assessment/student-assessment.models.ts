import { StudentAssessmentStatus } from "src/route-controllers/assessment/models/assessment.dto";
import { AssessmentTriggerType } from "../../database/entities";

/**
 * Service model to fetch Assessment History.
 */
export interface AssessmentHistory {
  submittedDate: Date;
  triggerType: AssessmentTriggerType;
  assessmentDate: Date;
  status: StudentAssessmentStatus;
}
