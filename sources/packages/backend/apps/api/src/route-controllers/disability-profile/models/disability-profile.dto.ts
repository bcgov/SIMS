import { DisabilityProfileStatus } from "@sims/sims-db";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Length,
  MaxLength,
  IsNotEmpty,
  IsIn,
} from "class-validator";

export class StudentDisabilityAPIInDTO {
  @Length(1, 100)
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
  @MaxLength(1000)
  diagnosisNotes?: string;
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => String)
  impairments: string[];
  @MaxLength(1000)
  disabilityNotes?: string;
  @MaxLength(1000)
  impairmentsNotes?: string;
  @MaxLength(1000)
  additionalNotes?: string;
}

export class StudentDisabilitiesAPIInDTO {
  @IsIn([DisabilityProfileStatus.Draft, DisabilityProfileStatus.Active])
  status: DisabilityProfileStatus;
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => StudentDisabilityAPIInDTO)
  disabilities: StudentDisabilityAPIInDTO[];
}
