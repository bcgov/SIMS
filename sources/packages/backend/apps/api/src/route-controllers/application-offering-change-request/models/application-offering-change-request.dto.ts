import {
  ApplicationOfferingChangeRequestStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
  OfferingIntensity,
  REASON_MAX_LENGTH,
} from "@sims/sims-db";
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { PaginationOptionsAPIInDTO } from "../../models/pagination.dto";

/**
 * Eligible applications offering change list details.
 */
export class ApplicationOfferingChangeSummaryAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
}

/**
 * Applications details for an eligible application to request an offering change.
 */
export class ApplicationOfferingChangeSummaryDetailAPIOutDTO {
  applicationNumber: string;
  programId: number;
  isProgramActive: boolean;
  offeringId: number;
  offeringIntensity: OfferingIntensity;
  programYearId: number;
  fullName: string;
}

/**
 * In progress application offering change details.
 */
export class InProgressApplicationOfferingChangesAPIOutDTO {
  id: number;
  applicationNumber: string;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
}

export interface ApplicationOfferingDetails {
  studentName: string;
  applicationNumber: string;
  locationName: string;
  reasonForChange: string;
  accessedNoteDescription: string;
  applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus;
}

/**
 * Completed application offering change details.
 */
export class CompletedApplicationOfferingChangesAPIOutDTO {
  id: number;
  applicationNumber: string;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
  dateCompleted: Date;
}

/**
 * Extended pagination option for the application offering change.
 */
export class OfferingChangePaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["applicationNumber", "fullName"])
  sortField?: string;
}

/**
 * Extended pagination option for the completed application offering change.
 */
export class CompletedOfferingChangePaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["applicationNumber", "fullName"])
  sortField?: string;
}

/**
 * Extended pagination option for the in progress application offering change.
 */
export class InProgressOfferingChangePaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["applicationNumber", "fullName"])
  sortField?: string;
}

/**
 * Application Offering Change Request details (Student).
 */
export class ApplicationOfferingDetailsAPIOutDTO {
  applicationNumber: string;
  locationName: string;
  status: ApplicationOfferingChangeRequestStatus;
  requestedOfferingId: number;
  activeOfferingId: number;
  reason: string;
}

/**
 * Application Offering Change Request details (Institution).
 */
export class ApplicationOfferingChangesAPIOutDTO extends ApplicationOfferingDetailsAPIOutDTO {
  id: number;
  applicationId: number;
  requestedOfferingDescription: string;
  requestedOfferingProgramId: number;
  requestedOfferingProgramName: string;
  assessedNoteDescription?: string;
  studentFullName: string;
}

/**
 * Application Offering Change Request details (Ministry).
 */
export class ApplicationOfferingChangeDetailsAPIOutDTO extends ApplicationOfferingDetailsAPIOutDTO {
  assessedNoteDescription?: string;
  studentFullName: string;
  assessedDate?: Date;
  assessedBy?: string;
  institutionId: number;
  institutionName: string;
  submittedDate: Date;
  studentActionDate?: Date;
}

/**
 * Application Offering Change Request Status.
 */
export class ApplicationOfferingChangeRequestStatusAPIOutDTO {
  status: ApplicationOfferingChangeRequestStatus;
}

/**
 * Information provided by the institution to create a new Application Offering Change Request.
 */
export class CreateApplicationOfferingChangeRequestAPIInDTO {
  @IsPositive()
  applicationId: number;
  @IsPositive()
  offeringId: number;
  @IsNotEmpty()
  @MaxLength(REASON_MAX_LENGTH)
  reason: string;
}

/**
 * Details to update the application offering change request by student.
 */
export class StudentApplicationOfferingChangeRequestAPIInDTO {
  @IsBoolean()
  @ValidateIf(
    (value: StudentApplicationOfferingChangeRequestAPIInDTO) =>
      value.applicationOfferingChangeRequestStatus ===
      ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
  )
  studentConsent: boolean;
  @IsEnum(ApplicationOfferingChangeRequestStatus)
  applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus;
}

export class ApplicationOfferingChangeAssessmentAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
  @IsIn([
    ApplicationOfferingChangeRequestStatus.Approved,
    ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
  ])
  applicationOfferingChangeRequestStatus:
    | ApplicationOfferingChangeRequestStatus.Approved
    | ApplicationOfferingChangeRequestStatus.DeclinedBySABC;
}

/**
 * All in progress application offering change details.
 */
export class AllInProgressApplicationOfferingChangesAPIOutDTO {
  id: number;
  applicationNumber: string;
  applicationId: number;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
  createdAt: string;
  studentId: number;
}

/**
 * Extended pagination option for the in progress application offering change.
 */
export class AllInProgressOfferingChangePaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["dateSubmitted", "status"])
  sortField?: string;
}
