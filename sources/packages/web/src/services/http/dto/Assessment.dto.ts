import {
  AssessmentTriggerType,
  ScholasticStandingStatus,
  StudentAppealStatus,
  StudentAssessmentStatus,
} from "@/types";

export interface RequestAssessmentSummaryApiOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus | ScholasticStandingStatus;
  triggerType: AssessmentTriggerType;
}

export interface AssessmentHistorySummaryApiOutDTO {
  assessmentId: number;
  submittedDate: Date;
  triggerType: AssessmentTriggerType;
  assessmentDate: Date;
  status: StudentAssessmentStatus;
  studentAppealId?: number;
  studentScholasticStandingId?: number;
}
