import {
  ApplicationOfferingChangeRequestStatus,
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
  applicationId: number;
  studyStartDate: string;
  studyEndDate: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
}

/**
 * Completed application offering change details.
 */
export class CompletedApplicationOfferingChangesAPIOutDTO {
  id: number;
  applicationNumber: string;
  applicationId: number;
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
 * Application Offering Change Request details.
 */
export class ApplicationOfferingChangesAPIOutDTO {
  id: number;
  status: ApplicationOfferingChangeRequestStatus;
  applicationId: number;
  applicationNumber: string;
  locationName: string;
  activeOfferingId: number;
  requestedOfferingId: number;
  requestedOfferingDescription: string;
  requestedOfferingProgramId: number;
  requestedOfferingProgramName: string;
  reason?: string;
  assessedNoteDescription?: string;
  studentFullName: string;
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
export class UpdateApplicationOfferingChangeRequestAPIInDTO {
  @IsOptional()
  @IsBoolean()
  studentConsent?: boolean;
  @IsEnum(ApplicationOfferingChangeRequestStatus)
  applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus;
}
