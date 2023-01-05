import {
  InstitutionLocationData,
  DesignationAgreementStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";
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
} from "class-validator";

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
  startDate?: string;
  @ValidateIf(
    (value: UpdateDesignationAPIInDTO) =>
      value.designationStatus === DesignationAgreementStatus.Approved,
  )
  @IsNotEmpty()
  @IsDateString()
  endDate?: string;
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
  dynamicData: any;
  locations: SubmittedLocationsAPIInDTO[];
}

/**
 * This DTO contains dynamic data that must
 * be validated by the form.io dryrun validation.
 */
export class SubmittedLocationsAPIInDTO {
  locationId: number;
  requestForDesignation: boolean;
}

export class DesignationAgreementAPIOutDTO {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  locationsDesignations: LocationDesignationAPIOutDTO[];
  submittedData: any;
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
  designationStatus: DesignationAgreementStatus;
  startDate?: string;
  endDate?: string;
  locationsDesignations?: DesignationLocationAPIInDTO[];
  note: string;
}
