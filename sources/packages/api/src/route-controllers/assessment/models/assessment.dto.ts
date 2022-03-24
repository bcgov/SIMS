import {
  AssessmentTriggerType,
  ScholasticStandingStatus,
  StudentAppealStatus,
} from "../../../database/entities";

export enum AssessmentHistoryStatus {
  Submitted = "Submitted",
  InProgress = "In Progress",
  Completed = "Completed",
}

export class RequestAssessmentSummaryDTO {
  submittedDate: Date;
  status: StudentAppealStatus | ScholasticStandingStatus;
  triggerType: AssessmentTriggerType;
}

export class AssessmentHistorySummaryDTO {
  submittedDate: Date;
  status: AssessmentHistoryStatus;
  triggerType: AssessmentTriggerType;
  assessmentDate: Date;
}
