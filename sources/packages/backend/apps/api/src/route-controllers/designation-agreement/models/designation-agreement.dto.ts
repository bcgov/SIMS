import {
  DesignationAgreementStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { UpdateDesignationLocation } from "./designation-agreement.model";

/**
 * Approve/Deny a designation agreement.
 * startDate, endDate and locationsDesignations used only for approval.
 */
export class UpdateDesignationAPIInDto {
  @IsEnum(DesignationAgreementStatus)
  designationStatus: DesignationAgreementStatus;
  @IsOptional()
  @IsDate()
  startDate?: Date;
  @IsOptional()
  @IsDate()
  endDate?: Date;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDesignationLocation)
  locationsDesignations?: UpdateDesignationLocation[];
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}
