import {
  AssessmentTriggerType,
  ScholasticStandingStatus,
  StudentAppealStatus,
} from "../../../database/entities";

export class RequestAssessmentSummaryApiOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus | ScholasticStandingStatus;
  triggerType: AssessmentTriggerType;
}
