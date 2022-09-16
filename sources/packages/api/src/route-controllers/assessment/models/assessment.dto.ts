import { StudentAssessmentStatus } from "../../../services/student-assessment/student-assessment.models";
import {
  ApplicationExceptionStatus,
  Assessment,
  AssessmentTriggerType,
  OfferingIntensity,
  OfferingStatus,
  StudentAppealStatus,
} from "../../../database/entities";
import { ApiProperty } from "@nestjs/swagger";

export enum RequestAssessmentTypeAPIOutDTO {
  StudentException = "Student exceptions",
  StudentAppeal = "Student appeal",
  OfferingRequest = "Offering request",
}

type RequestAssessmentSummaryStatus =
  | StudentAppealStatus
  | ApplicationExceptionStatus
  | OfferingStatus;

export class RequestAssessmentSummaryAPIOutDTO {
  id: number;
  submittedDate: Date;
  status: RequestAssessmentSummaryStatus;
  requestType: RequestAssessmentTypeAPIOutDTO;
  programId?: number;
}

export class AssessmentHistorySummaryAPIOutDTO {
  assessmentId?: number;
  submittedDate: Date;
  triggerType: AssessmentTriggerType;
  assessmentDate?: Date;
  status: StudentAssessmentStatus;
  offeringId?: number;
  programId?: number;
  studentAppealId?: number;
  applicationExceptionId?: number;
  studentScholasticStandingId?: number;
  // This flag decides, the row is unsuccessful week or not.
  hasUnsuccessfulWeeks?: boolean;
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
  disbursement: DynamicAwardDTO;
}

export class AwardDetailsAPIOutDTO {
  applicationNumber: string;
  institutionName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  @ApiProperty({
    description:
      "Dynamic output of the workflow calculation. " +
      "Contains data that could represent a part-time or a full-time award details. ",
  })
  estimatedAward: DynamicAwardDTO;
  @ApiProperty({
    description:
      "Dynamic output from disbursement receipt for the given disbursement. " +
      "Contains data that could represent a part-time or a full-time award details. ",
  })
  finalAward: DynamicAwardDTO;
}

export interface DynamicAwardDTO {
  [k: string]: string | number;
}
