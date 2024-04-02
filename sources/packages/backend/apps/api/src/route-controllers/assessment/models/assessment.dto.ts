import {
  ApplicationExceptionStatus,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  Assessment,
  AssessmentStatus,
  AssessmentTriggerType,
  NOTE_DESCRIPTION_MAX_LENGTH,
  OfferingIntensity,
  OfferingStatus,
  StudentAppealStatus,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";

export enum RequestAssessmentTypeAPIOutDTO {
  StudentException = "Student exceptions",
  StudentAppeal = "Student appeal",
  OfferingRequest = "Offering request",
  ApplicationOfferingChangeRequest = "Application offering change",
}

type RequestAssessmentSummaryStatus =
  | StudentAppealStatus
  | ApplicationExceptionStatus
  | OfferingStatus
  | ApplicationOfferingChangeRequestStatus;

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
  applicationOfferingChangeRequestId?: number;
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
  applicationId: number;
  applicationNumber: string;
  fullName: string;
  programName: string;
  locationName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  eligibleAmount: number;
  disbursement: Record<string, string | number>;
  noaApprovalStatus: AssessmentStatus;
  applicationStatus: ApplicationStatus;
}

export class AwardDetailsAPIOutDTO {
  applicationNumber: string;
  applicationStatus: ApplicationStatus;
  institutionName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
  @ApiProperty({
    description:
      "Dynamic output of the workflow calculation. " +
      "Contains data that could represent a part-time or a full-time award details. ",
  })
  estimatedAward: Record<string, string | number>;
  @ApiProperty({
    description:
      "Dynamic output from disbursement receipt for the given disbursement. " +
      "Contains data that could represent a part-time or a full-time award details. " +
      "If the conditions to have a receipt are not match this information will not be available.",
  })
  finalAward?: Record<string, string | number>;
}

export class ManualReassessmentAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}
