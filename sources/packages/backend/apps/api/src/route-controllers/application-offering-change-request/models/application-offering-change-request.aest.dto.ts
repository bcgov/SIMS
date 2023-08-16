import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";
import { IsIn, IsOptional } from "class-validator";
import { PaginationOptionsAPIInDTO } from "../../models/pagination.dto";

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
export class InProgressOfferingChangePaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["dateSubmitted", "status"])
  sortField?: string;
}
