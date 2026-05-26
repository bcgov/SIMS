import { DisabilityProfileStatus } from "@sims/sims-db";
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

export class StudentDisabilityAPIOutDTO {
  id: number;
  disabilityPriority: number;
  disabilityCategory: string;
  disabilityType: string;
  diagnosis: string;
  diagnosisNotes?: string;
  impairments: string[];
  disabilityNotes?: string;
  impairmentsNotes?: string;
  additionalNotes?: string;
}

export class StudentDisabilityProfileAPIOutDTO {
  id: number;
  status: DisabilityProfileStatus;
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
  @Max(100)
  disabilityPriority: number;
  @IsNotEmpty()
  @MaxLength(100)
  disabilityCategory: string;
  @IsNotEmpty()
  @MaxLength(100)
  disabilityType: string;
  @IsNotEmpty()
  @MaxLength(250)
  diagnosis: string;
  @IsOptional()
  @MaxLength(1000)
  diagnosisNotes?: string;
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  impairments: string[];
  @IsOptional()
  @MaxLength(1000)
  disabilityNotes?: string;
  @IsOptional()
  @MaxLength(1000)
  impairmentsNotes?: string;
  @IsOptional()
  @MaxLength(1000)
  additionalNotes?: string;
}

export class SaveStudentDisabilityProfileAPIInDTO {
  /**
   * Required when updating an existing draft profile, or completing a draft profile to active status.
   */
  @IsOptional()
  @IsPositive()
  id?: number;
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => StudentDisabilityAPIInDTO)
  disabilities: StudentDisabilityAPIInDTO[];
}
