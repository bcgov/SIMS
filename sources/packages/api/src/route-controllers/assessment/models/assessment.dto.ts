import {
  AssessmentTriggerType,
  ScholasticStandingStatus,
  StudentAppealStatus,
} from "../../../database/entities";

export class RequestAssessmentSummaryDTO {
  submittedDate: Date;
  status: StudentAppealStatus | ScholasticStandingStatus;
  triggerType: AssessmentTriggerType;
}
