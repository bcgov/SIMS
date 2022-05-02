import {
  Assessment,
  AssessmentTriggerType,
  OfferingIntensity,
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

export interface AssessmentNOAAPIOutDTO {
  assessment: Assessment;
  applicationNumber: string;
  fullName: string;
  programName: string;
  locationName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  msfaaNumber: string;
  disbursement: any;
}
