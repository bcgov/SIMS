import {
  InstitutionLocationData,
  DesignationAgreementStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { Type } from "class-transformer";
import {
  IsBoolean,
  Min,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  ValidateIf,
  ValidateNested,
  IsIn,
  IsOptional,
  IsPositive,
  ArrayMinSize,
  Allow,
} from "class-validator";
import { JSON_20KB, PAGINATION_SEARCH_MAX_LENGTH } from "../../../constants";

/**
 * Approve/Deny a designation agreement.
 * startDate, endDate and locationsDesignations used only for approval.
 */
export class UpdateDesignationAPIInDTO {
  @IsEnum(DesignationAgreementStatus)
  designationStatus: DesignationAgreementStatus;
  @ValidateIf(
    (value: UpdateDesignationAPIInDTO) =>
      value.designationStatus === DesignationAgreementStatus.Approved,
  )
  @IsNotEmpty()
  @IsDateString()
  startDate: string;
  @ValidateIf(
    (value: UpdateDesignationAPIInDTO) =>
      value.designationStatus === DesignationAgreementStatus.Approved,
  )
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
  @ValidateIf(
    (value: UpdateDesignationAPIInDTO) =>
      value.designationStatus === DesignationAgreementStatus.Approved,
  )
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignationLocationAPIInDTO)
  locationsDesignations?: DesignationLocationAPIInDTO[];
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}

/**
 * This DTO contains dynamic data that must
 * be validated by the form.io dryrun validation.
 */
export class SubmitDesignationAgreementAPIInDTO {
  @Allow()
  @JsonMaxSize(JSON_20KB)
  dynamicData: unknown;
  /**
   * Locations being designated.
   * Must be validated because it is not part of the dynamic data.
   */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmittedLocationsAPIInDTO)
  locations: SubmittedLocationsAPIInDTO[];
  /**
   * isBCPrivate is part of the form and defines if the dynamic area of the form.io definition will be visible or not, which also will impact the validation using the dryrun.
   * Since this value has the source of truth on the institution, it must be populated by the API prior to the dryrun validation and it is part of DTO to make explicit its place in the form payload submitted but it will also be ignored by Nestjs because it does not have a decorator.
   */
  @Allow()
  isBCPrivate: boolean;
}

/**
 * This DTO contains dynamic data that must
 * be validated by the form.io dryrun validation.
 */
export class SubmittedLocationsAPIInDTO {
  @IsPositive()
  locationId: number;
  @IsBoolean()
  requestForDesignation: boolean;
}

export class DesignationAgreementAPIOutDTO {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  locationsDesignations: LocationDesignationAPIOutDTO[];
  submittedData: unknown;
  startDate: string;
  endDate: string;
  institutionId: number;
  institutionName: string;
  institutionType: string;
  isBCPrivate: boolean;
}

export class LocationDesignationAPIOutDTO {
  designationLocationId?: number;
  locationId: number;
  locationName: string;
  locationData: InstitutionLocationData;
  requested: boolean;
  approved?: boolean;
}

export class DesignationAgreementDetailsAPIOutDTO {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  submittedDate: Date;
  startDate?: string;
  endDate?: string;
}

export class PendingDesignationAgreementDetailsAPIOutDTO extends DesignationAgreementDetailsAPIOutDTO {
  legalOperatingName: string;
}

export class DesignationLocationAPIInDTO {
  @Min(1)
  locationId: number;
  @IsBoolean()
  approved: boolean;
}

/**
 * startDate, endDate and locationsDesignations used only for approval.
 */
export class UpdateDesignationDetailsAPIInDTO {
  @IsIn([
    DesignationAgreementStatus.Approved,
    DesignationAgreementStatus.Declined,
  ])
  designationStatus: DesignationAgreementStatus;
  @IsNotEmpty()
  @IsDateString()
  startDate: string;
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignationLocationAPIInDTO)
  locationsDesignations?: DesignationLocationAPIInDTO[];
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}

export class DesignationAgreementSearchAPIInDTO {
  /**
   * Criteria to be used to filter the records.
   */
  @IsOptional()
  @MaxLength(PAGINATION_SEARCH_MAX_LENGTH)
  searchCriteria?: string;
}
