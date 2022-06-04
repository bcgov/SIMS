import { StudentAssessmentStatus } from "../../../services/student-assessment/student-assessment.models";
import {
  ApplicationExceptionStatus,
  Assessment,
  AssessmentTriggerType,
  OfferingIntensity,
  StudentAppealStatus,
} from "../../../database/entities";
import { ApiProperty } from "@nestjs/swagger";

export enum RequestAssessmentTypeAPIOutDTO {
  StudentException = "Student exceptions",
  StudentAppeal = "Student appeal",
}

export class RequestAssessmentSummaryAPIOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus | ApplicationExceptionStatus;
  requestType: RequestAssessmentTypeAPIOutDTO;
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
  @ApiProperty({
    description:
      "Dynamic output of the workflow calculation. " +
      "Contains data that could represent a part-time or a full-time assessment. " +
      "Part-time and full-time will have some common and some specific properties for each payload.",
  })
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
