import { AssessmentTriggerType } from "./assessment-trigger.type";
import { ScholasticStandingStatus } from "./scholastic-standing-status.type";
import { StudentAppealStatus } from "./student-appeal-status.type";

/**
 * Possible status for an Assessment, when the Application_status is in Assessment
 */
export enum AssessmentStatus {
  /**
   * An Assessment is required
   */
  required = "Required",
  /**
   * An Assessment is not required, not used in our current workflow but having it as an placeholder
   */
  notRequired = "Not Required",
  /**
   * An Assessment is Completed
   */
  completed = "Completed",
  /**
   * An Assessment is Declined,  not used in our current workflow but having it as an placeholder
   */
  declined = "Declined",
}
/**
 * todo
 */
export enum AssessmentHistoryStatus {
  Submitted = "Submitted",
  InProgress = "In Progress",
  Completed = "Completed",
}

export interface RequestAssessmentSummaryDTO {
  submittedDate: Date;
  status: StudentAppealStatus | ScholasticStandingStatus;
  triggerType: AssessmentTriggerType;
}

export interface AssessmentHistorySummaryDTO {
  submittedDate: Date;
  status: AssessmentHistoryStatus;
  triggerType: AssessmentTriggerType;
  assessmentDate: Date;
}
