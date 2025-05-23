import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { PAGINATION_SEARCH_MAX_LENGTH } from "../../constants";
import { FieldSortOrder } from "@sims/utilities";
import {
  CASInvoiceBatchApprovalStatus,
  CASInvoiceStatus,
  OfferingIntensity,
  ProgramStatus,
} from "@sims/sims-db";
import { Transform } from "class-transformer";
import { ToBoolean } from "../../utilities/class-transform";

/**
 * Common parameters used when an API result
 * must enable pagination and search options.
 */
export abstract class PaginationOptionsAPIInDTO {
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
  @Max(Number.MAX_SAFE_INTEGER)
  page: number;
  /**
   * Page size or records per page.
   */
  @Min(1)
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
  @IsIn(["submittedDate", "applicationNumber", "givenNames", "lastName"])
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
  @IsIn(["submittedDate", "applicationNumber", "lastName"])
  sortField?: string;
}

export class ApplicationChangeRequestPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["submittedDate", "applicationNumber", "lastName"])
  sortField?: string;
}

export class ProgramsPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn([
    "submittedDate",
    "programName",
    "locationName",
    "programStatus",
    "credentialType",
  ])
  sortField?: string;
  @IsOptional()
  @MaxLength(PAGINATION_SEARCH_MAX_LENGTH)
  programNameSearch?: string;
  @IsOptional()
  @MaxLength(PAGINATION_SEARCH_MAX_LENGTH)
  locationNameSearch?: string;
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value.split(","))
  @IsEnum(ProgramStatus, { each: true })
  statusSearch?: ProgramStatus[];
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  inactiveProgramSearch?: boolean;
}

export class OfferingsPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["name"])
  sortField?: string;
}

export class CASInvoicePaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["invoiceStatusUpdatedOn"])
  sortField?: string;
  @IsEnum(CASInvoiceStatus)
  invoiceStatusSearch: CASInvoiceStatus;
}

export class CASInvoiceBatchesPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["batchDate"])
  sortField?: string;
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.split(","))
  @IsEnum(CASInvoiceBatchApprovalStatus, { each: true })
  approvalStatusSearch?: CASInvoiceBatchApprovalStatus[];
}

/**
 * Program Info Request specific pagination options.
 */
export class PIRPaginationOptionsAPIInDTO extends PaginationOptionsAPIInDTO {
  @IsOptional()
  @IsIn(["pirStatus", "submittedDate", "studyStartPeriod", "studyEndPeriod"])
  sortField?: string;

  @IsOptional()
  search?: string;

  @IsOptional()
  @IsEnum(OfferingIntensity)
  intensityFilter?: OfferingIntensity;
}

/**
 * Common DTO result used when an API endpoint
 * must enable pagination and search options.
 */
export class PaginatedResultsAPIOutDTO<T> {
  results: T[];
  count: number;
}
