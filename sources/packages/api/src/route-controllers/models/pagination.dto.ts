import { IsEnum, IsOptional, IsPositive, Min } from "class-validator";
import { FieldSortOrder } from "../../utilities";

/**
 * Common parameters used when an API result
 * must enable pagination and search options.
 */
export class PaginationOptionsAPIInDTO {
  /**
   * Field to be sorted.
   */
  @IsOptional()
  sortField?: string;
  /**
   * Order to be sorted.
   */
  @IsEnum(FieldSortOrder)
  sortOrder? = FieldSortOrder.ASC;
  /**
   * Page number.
   */
  @Min(0)
  page: number;
  /**
   * Page size or records per page.
   */
  @IsPositive()
  pageLimit: number;
  @IsOptional()
  /**
   * Criteria to be used to filter the records.
   */
  searchCriteria?: string;
}

/**
 * Common DTO result used when an API endpoint
 * must enable pagination and search options.
 */
export class PaginatedResultsAPIOutDTO<T> {
  results: T[];
  count: number;
}
