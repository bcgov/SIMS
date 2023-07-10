import {
  ApplicationOfferingChangeRequestStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import { IsIn, IsOptional } from "class-validator";
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
  applicationId: number;
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
}
