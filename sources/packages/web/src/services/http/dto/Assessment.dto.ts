import {
  AssessmentTriggerType,
  ScholasticStandingStatus,
  StudentAppealStatus,
  StudentAssessmentStatus,
} from "@/types";

export const ASSESSMENT_ALREADY_IN_PROGRESS = "ASSESSMENT_ALREADY_IN_PROGRESS";

export interface RequestAssessmentSummaryAPIOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus | ScholasticStandingStatus;
  triggerType: AssessmentTriggerType;
}

export interface AssessmentHistorySummaryAPIOutDTO {
  assessmentId: number;
  submittedDate: Date;
  triggerType: AssessmentTriggerType;
  assessmentDate: Date;
  status: StudentAssessmentStatus;
  studentAppealId?: number;
  studentScholasticStandingId?: number;
}
