import { IsEnum, IsIn, IsOptional, Max, MaxLength, Min } from "class-validator";
import { FieldSortOrder } from "../../utilities";
import { PAGINATION_SEARCH_MAX_LENGTH } from "../../constants";

/**
 * Common parameters used when an API result
 * must enable pagination and search options.
 */
abstract class PaginationOptionsAPIInDTO {
  /**
   * Field to be sorted.
   */
  abstract sortField?: string;
  /**
   * Order to be sorted.
   */
  @IsOptional()
  @IsEnum(FieldSortOrder)
  sortOrder?: FieldSortOrder;
  /**
   * Page number.
   */
  @Min(0)
  page: number;
  /**
   * Page size or records per page.
   * -1 means all records.
   */
  @Min(-1)
  @Max(100)
  pageLimit: number;
  /**
   * Criteria to be used to filter the records.
   */
  @IsOptional()
  @MaxLength(PAGINATION_SEARCH_MAX_LENGTH)
  searchCriteria?: string;
}

export class ApplicationPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["status", "applicationNumber"])
  sortField?: string;
}

export class ApplicationStatusPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["applicationNumber", "fullName"])
  sortField?: string;
}

export class ApplicationExceptionPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["submittedDate", "applicationNumber", "fullName"])
  sortField?: string;
}

export class InstitutionUserPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["displayName", "email", "userType", "role", "isActive"])
  sortField?: string;
}

export class ConfirmationOfEnrollmentPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["fullName", "applicationNumber", "disbursementDate", "coeStatus"])
  sortField?: string;
}

export class StudentAppealPendingPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["submittedDate", "applicationNumber", "fullName"])
  sortField?: string;
}

export class ProgramsPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["submittedDate", "programName", "credentialType"])
  sortField?: string;
}

export class OfferingsPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["name"])
  sortField?: string;
}

/**
 * Common DTO result used when an API endpoint
 * must enable pagination and search options.
 */
export class PaginatedResultsAPIOutDTO<T> {
  results: T[];
  count: number;
}
