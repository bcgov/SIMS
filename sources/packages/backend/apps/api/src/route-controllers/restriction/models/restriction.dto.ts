import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
} from "class-validator";
import {
  APPLICATION_NUMBER_LENGTH,
  RestrictionNotificationType,
  NOTE_DESCRIPTION_MAX_LENGTH,
  RestrictionType,
  RESTRICTION_CATEGORY_MAX_LENGTH,
  RestrictionActionType,
  FieldRequirementType,
  InstitutionRestrictionDisplayScope,
} from "@sims/sims-db";

/**
 * Maximum allowed locations while assigning institution restriction.
 * Added a non-real-world limit to avoid leaving the API open to
 * receive a very large payloads.
 */
const MAX_ALLOWED_LOCATIONS = 100;

/**
 * Maximum number of application numbers accepted in a single batch student restrictions submission.
 */
const BATCH_STUDENT_RESTRICTIONS_MAX_APPLICATION_NUMBERS = 50000;

/**
 * Base DTO for restriction.
 */
export class RestrictionBaseAPIOutDTO {
  restrictionId: number;
  restrictionType: RestrictionType;
  restrictionCategory: string;
  restrictionCode: string;
  description: string;
}

/**
 * DTO class for institution restriction summary.
 */
export class RestrictionInstitutionSummaryAPIOutDTO extends RestrictionBaseAPIOutDTO {
  createdAt: Date;
  isActive: boolean;
}

/**
 * DTO class for student restriction summary.
 */
export class RestrictionSummaryAPIOutDTO extends RestrictionBaseAPIOutDTO {
  createdAt: Date;
  isActive: boolean;
  resolvedAt?: Date;
  deletedAt?: Date;
}

/**
 * Institution restriction summary.
 */
export class InstitutionRestrictionSummaryAPIOutDTO extends RestrictionBaseAPIOutDTO {
  locationName: string;
  programName: string;
  createdAt: Date;
  isActive: boolean;
  resolvedAt?: Date;
}

/**
 * DTO class for institution restriction details.
 */
export class RestrictionInstitutionDetailAPIOutDTO extends RestrictionBaseAPIOutDTO {
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  restrictionNote: string;
}

/**
 * DTO class for student/institution restriction details.
 */
export class RestrictionDetailAPIOutDTO extends RestrictionSummaryAPIOutDTO {
  createdBy: string;
  resolvedBy: string;
  deletedBy?: string;
  restrictionNote?: string;
  resolutionNote?: string;
  deletionNote?: string;
}

/**
 * DTO to resolve restriction to a student/institution.
 */
export class ResolveRestrictionAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

/**
 * Delete a restriction from a student.
 */
export class DeleteRestrictionAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

/**
 * DTO to add restriction to a student.
 */
export class AssignRestrictionAPIInDTO extends ResolveRestrictionAPIInDTO {
  @IsPositive()
  restrictionId: number;
}

/**
 * Add restriction to an institution.
 */
export class AssignInstitutionRestrictionAPIInDTO extends AssignRestrictionAPIInDTO {
  /**
   * List of location IDs where the restriction is applicable.
   * A new restriction will be created for each location ID provided.
   */
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ALLOWED_LOCATIONS)
  @IsPositive({ each: true })
  locationIds?: number[];
  /**
   * Program ID where the restriction is applicable.
   */
  @IsOptional()
  @IsPositive()
  programId?: number;
}

/**
 * DTO to identify if a student/institution has valid restriction assigned.
 */
export class RestrictionStatusAPIOutDTO {
  isActive: boolean;
}

/**
 * DTO for student restriction.
 * This object is returned by api.
 */
export class StudentRestrictionAPIOutDTO {
  /**
   * Restriction code.
   */
  code: string;
  /**
   * Notification type.
   */
  type: RestrictionNotificationType;
}

/**
 * Institution restriction details.
 */
export class InstitutionRestrictionAPIOutDTO {
  restrictionActions: RestrictionActionType[];
}

/**
 * Institution restrictions.
 */
export class InstitutionRestrictionsAPIOutDTO {
  institutionRestrictions: InstitutionRestrictionAPIOutDTO[];
}

/**
 * Active institution restriction details.
 */
export class InstitutionActiveRestrictionAPIOutDTO {
  programId?: number;
  locationId?: number;
  restrictionCode: string;
  restrictionActions: RestrictionActionType[];
  restrictionNotificationType: RestrictionNotificationType;
  displayScope?: InstitutionRestrictionDisplayScope;
  bannerMessage?: string;
}

/**
 * Active institution restrictions.
 */
export class InstitutionActiveRestrictionsAPIOutDTO {
  items: InstitutionActiveRestrictionAPIOutDTO[];
}

/**
 * Query string options for filtering the restriction reasons.
 */
export class RestrictionReasonsOptionsAPIInDTO {
  /**
   * Type of the restriction expected to be filtered.
   */
  @IsIn([RestrictionType.Provincial, RestrictionType.Institution])
  type: RestrictionType.Provincial | RestrictionType.Institution;
  /**
   * Category of the restriction expected to be filtered.
   */
  @IsOptional()
  @MaxLength(RESTRICTION_CATEGORY_MAX_LENGTH)
  category?: string;
}

/**
 * Restriction details.
 */
export class RestrictionAPIOutDTO {
  id: number;
  description: string;
  fieldRequirements?: Record<string, FieldRequirementType>;
}

/**
 * Payload used to add a restriction to the students of a list of application numbers.
 */
export class BatchStudentRestrictionsAPIInDTO {
  @IsPositive()
  restrictionId: number;
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(BATCH_STUDENT_RESTRICTIONS_MAX_APPLICATION_NUMBERS)
  @IsString({ each: true })
  @Length(APPLICATION_NUMBER_LENGTH, APPLICATION_NUMBER_LENGTH, { each: true })
  applicationNumbers: string[];
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}

/**
 * Summary of a batch student restrictions submission, including how many
 * restrictions were successfully added and how many failed.
 */
export class BatchStudentRestrictionsSummaryAPIOutDTO {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorName: string;
  restrictionCode: string;
  restrictionDescription: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
}
