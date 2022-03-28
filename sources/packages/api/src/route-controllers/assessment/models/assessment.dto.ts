import {
  AssessmentTriggerType,
  ScholasticStandingStatus,
  StudentAppealStatus,
} from "../../../database/entities";

export enum StudentAssessmentStatus {
  Submitted = "Submitted",
  InProgress = "In Progress",
  Completed = "Completed",
}

export class RequestAssessmentSummaryDTO {
  submittedDate: Date;
  status: StudentAppealStatus | ScholasticStandingStatus;
  triggerType: AssessmentTriggerType;
}
