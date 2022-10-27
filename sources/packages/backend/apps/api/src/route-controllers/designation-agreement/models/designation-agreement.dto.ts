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
  MaxLength,
  ValidateIf,
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
  @ValidateIf(
    (value: UpdateDesignationAPIInDto) =>
      value.designationStatus === DesignationAgreementStatus.Approved,
  )
  @IsNotEmpty()
  @IsDate()
  startDate?: Date;
  @ValidateIf(
    (value: UpdateDesignationAPIInDto) =>
      value.designationStatus === DesignationAgreementStatus.Approved,
  )
  @IsNotEmpty()
  @IsDate()
  endDate?: Date;
  @ValidateIf(
    (value: UpdateDesignationAPIInDto) =>
      value.designationStatus === DesignationAgreementStatus.Approved,
  )
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDesignationLocation)
  locationsDesignations?: UpdateDesignationLocation[];
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}
