import {
  DIAGNOSIS_MAX_LENGTH,
  DISABILITY_NOTES_MAX_LENGTH,
  DisabilityProfileStatus,
  FINAL_NOTES_MAX_LENGTH,
  IMPAIRMENTS_NOTES_MAX_LENGTH,
  LOOKUP_KEY_MAX_LENGTH,
} from "@sims/sims-db";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
  Min,
  Max,
} from "class-validator";

const MAX_DISABILITIES_PER_PROFILE = 25;
const MAX_DIAGNOSIS_ENTRIES = 50;
const MAX_IMPAIRMENTS_ENTRIES = 50;

export class StudentDisabilityAPIOutDTO {
  id: number;
  disabilityPriority: number;
  disabilityCategory: string;
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
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_DIAGNOSIS_ENTRIES)
  @IsString({ each: true })
  @MaxLength(DIAGNOSIS_MAX_LENGTH, { each: true })
  diagnosis: string[];
  @IsOptional()
  @MaxLength(DIAGNOSIS_MAX_LENGTH)
  diagnosisNotes?: string;
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMPAIRMENTS_ENTRIES)
  @IsString({ each: true })
  impairments: string[];
  @IsOptional()
  @MaxLength(DISABILITY_NOTES_MAX_LENGTH)
  disabilityNotes?: string;
  @IsOptional()
  @MaxLength(IMPAIRMENTS_NOTES_MAX_LENGTH)
  impairmentsNotes?: string;
  @IsOptional()
  @MaxLength(FINAL_NOTES_MAX_LENGTH)
  finalNotes?: string;
}

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
