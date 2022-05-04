import { StudentAssessmentStatus } from "../../../services/student-assessment/student-assessment.models";
import {
  Assessment,
  AssessmentTriggerType,
  OfferingIntensity,
  ScholasticStandingStatus,
  StudentAppealStatus,
} from "../../../database/entities";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

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
  @ApiProperty({
    description: "Dynamic output of the workflow calculation.",
  })
  /**
   * Represents the dynamic content of the workflow calculation.
   ** This property should not be mapped to a DTO class otherwise it will
   ** have the non-mapped properties removed from the payload (by Nestjs) and the
   ** workflow should be able to output more variables that could be directly
   ** consumed by an API client without API code modification.
   */
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
