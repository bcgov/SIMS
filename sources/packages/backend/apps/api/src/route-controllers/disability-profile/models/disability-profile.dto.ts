import {
  DIAGNOSIS_MAX_LENGTH,
  DIAGNOSIS_NOTES_MAX_LENGTH,
  DISABILITY_NOTES_MAX_LENGTH,
  DisabilityProfileStatus,
  FINAL_NOTES_MAX_LENGTH,
  IMPAIRMENTS_NOTES_MAX_LENGTH,
  LOOKUP_KEY_MAX_LENGTH,
} from "@sims/sims-db";
import { AddressAPIOutDTO } from "apps/api/src/route-controllers/models/common.dto";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsPositive,
  IsString,
  ValidateNested,
  Min,
  Max,
  Length,
} from "class-validator";

/**
 * Limit the max number of disabilities per profile to prevent abuse.
 * No business rule defined for this.
 */
const MAX_DISABILITIES_PER_PROFILE = 25;
/**
 * Limit the max number of diagnosis entries per disability to prevent abuse.
 * No business rule defined for this.
 */
const MAX_DIAGNOSIS_ENTRIES = 50;
/**
 * Limit the max number of impairments entries per disability to prevent abuse.
 * No business rule defined for this.
 */
const MAX_IMPAIRMENTS_ENTRIES = 50;

export class StudentDisabilityAPIOutDTO {
  id: number;
  disabilityPriority: number;
  disabilityCategory: string;
  disabilityCategoryDescription: string;
  disabilityType: string;
  diagnosis: string[];
  diagnosisNotes?: string;
  impairments: string[];
  disabilityNotes?: string;
  impairmentsNotes?: string;
  finalNotes?: string;
}

export class StudentDisabilityProfileAPIOutDTO {
  id: number;
  status: DisabilityProfileStatus;
  completedBy?: string;
  completedAt?: Date;
  disabilities: StudentDisabilityAPIOutDTO[];
  creator: string;
  createdAt: Date;
  modifier?: string;
  updatedAt?: Date;
}

export class StudentDisabilityProfilesAPIOutDTO {
  profiles: StudentDisabilityProfileAPIOutDTO[];
}

export class DisabilityProfilesQueryExternalAPIInDTO {
  /**
   * Modified since date.
   * Should be a valid ISO 8601 utc date string, e.g. "2024-01-01T00:00:00.000Z".
   */
  @IsNotEmpty()
  @IsDateString({ strict: true, strictSeparator: true })
  modifiedSince: string;
}

export class DisabilityExternalAPIOutDTO {
  /**
   * The priority of the disability within the profile, where 1 indicates the primary disability
   * and other values indicate secondary disabilities.
   */
  disabilityPriority: number;
  disabilityCategory: string;
  disabilityType: string;
  disabilityNotes?: string;
  diagnosis: string[];
  diagnosisNotes?: string;
  impairments: string[];
  impairmentsNotes?: string;
  finalNotes?: string;
}

export class DisabilityProfileExternalAPIOutDTO {
  firstName?: string;
  lastName: string;
  sin: string;
  address: AddressAPIOutDTO;
  disabilities: DisabilityExternalAPIOutDTO[];
}

export class DisabilityProfileMetadataExternalAPIOutDTO {
  modifiedUntil: Date;
}

export class DisabilityProfilesExternalAPIOutDTO {
  profiles: DisabilityProfileExternalAPIOutDTO[];
  metadata: DisabilityProfileMetadataExternalAPIOutDTO;
}

export class StudentDisabilityAPIInDTO {
  @IsOptional()
  @IsPositive()
  id?: number;
  @Min(1)
  @Max(MAX_DISABILITIES_PER_PROFILE)
  disabilityPriority: number;
  @IsNotEmpty()
  @MaxLength(LOOKUP_KEY_MAX_LENGTH)
  disabilityCategory: string;
  @IsNotEmpty()
  @MaxLength(LOOKUP_KEY_MAX_LENGTH)
  disabilityType: string;
  @IsOptional()
  @Length(1, DISABILITY_NOTES_MAX_LENGTH)
  disabilityNotes?: string;
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_DIAGNOSIS_ENTRIES)
  @IsString({ each: true })
  @MaxLength(DIAGNOSIS_MAX_LENGTH, { each: true })
  diagnosis: string[];
  @IsOptional()
  @Length(1, DIAGNOSIS_NOTES_MAX_LENGTH)
  diagnosisNotes?: string;
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMPAIRMENTS_ENTRIES)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(LOOKUP_KEY_MAX_LENGTH, { each: true })
  impairments: string[];
  @IsOptional()
  @Length(1, IMPAIRMENTS_NOTES_MAX_LENGTH)
  impairmentsNotes?: string;
  @IsOptional()
  @Length(1, FINAL_NOTES_MAX_LENGTH)
  finalNotes?: string;
}

/**
 * Shared payload for creating and updating student disability profiles,
 * draft or active. The presence of the id field indicates that a record
 * is expected to be updated, either a draft, or a draft to be completed
 * to active.
 */
export class SaveStudentDisabilityProfileAPIInDTO {
  /**
   * Required when updating an existing draft profile, or completing a draft profile to active status.
   */
  @IsOptional()
  @IsPositive()
  id?: number;
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_DISABILITIES_PER_PROFILE)
  @ValidateNested({ each: true })
  @Type(() => StudentDisabilityAPIInDTO)
  disabilities: StudentDisabilityAPIInDTO[];
}
