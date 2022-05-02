import { StudentAssessmentStatus } from "../../../services/student-assessment/student-assessment.models";
import {
  Assessment,
  AssessmentTriggerType,
  OfferingIntensity,
  ScholasticStandingStatus,
  StudentAppealStatus,
} from "../../../database/entities";

export class RequestAssessmentSummaryAPIOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus | ScholasticStandingStatus;
  triggerType: AssessmentTriggerType;
}

export class AssessmentHistorySummaryAPIOutDTO {
  assessmentId: number;
  submittedDate: Date;
  triggerType: AssessmentTriggerType;
  assessmentDate: Date;
  status: StudentAssessmentStatus;
  studentAppealId?: number;
  studentScholasticStandingId?: number;
}

export class AssessmentNOAAPIOutDTO {
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
