import { IsEnum, IsIn, IsOptional, Max, Min } from "class-validator";
import { FieldSortOrder } from "../../utilities";

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
   */
  @Min(1)
  @Max(50)
  pageLimit: number;
  /**
   * Criteria to be used to filter the records.
   */
  @IsOptional()
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

export class StudentAppealPendingPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["submittedDate", "applicationNumber", "fullName"])
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
