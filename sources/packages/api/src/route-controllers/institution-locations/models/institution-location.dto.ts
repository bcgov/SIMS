import { Allow, IsNotEmptyObject } from "class-validator";
import { InstitutionLocationInfo } from "../../../database/entities/institution-location.model";
import {
  AddressDetailsAPIInDTO,
  AddressDetailsAPIOutDTO,
  AddressInfoAPIOutDTO,
} from "../../models/common.dto";

export class GetInstitutionLocationDto {
  id: number;
  data: InstitutionLocationInfo;
  name: string;
}

/**
 * Payload/Input DTO for institution location.
 ** Class validators are not used for DTO validation
 ** because of dry-run validation.
 */
export class InstitutionLocationFormAPIInDTO extends AddressDetailsAPIInDTO {
  @Allow()
  locationName: string;
  @Allow()
  institutionCode: string;
  @Allow()
  primaryContactFirstName: string;
  @Allow()
  primaryContactLastName: string;
  @Allow()
  primaryContactEmail: string;
  @Allow()
  primaryContactPhone: string;
}

/**
 * Response/Output DTO for institution location.
 */
export class InstitutionLocationFormAPIOutDTO extends AddressDetailsAPIOutDTO {
  locationName: string;
  institutionCode: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

export class InstitutionPrimaryContactInDTO {
  @Allow()
  primaryContactFirstName: string;
  @Allow()
  primaryContactLastName: string;
  @Allow()
  primaryContactEmail: string;
  @Allow()
  primaryContactPhone: string;
}

export class InstitutionPrimaryContactOutDTO {
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

/**
 * DTO which defines the contract of how institution location data is passed to Vue component
 */
export class InstitutionLocationAPIOutDTO {
  id: number;
  name: string;
  data: {
    address: AddressInfoAPIOutDTO;
  };
  primaryContact: InstitutionPrimaryContactOutDTO;
  institutionCode: string;
  designationStatus: DesignationStatus;
}

export interface UserLocationDto {
  id: number;
  name: string;
}

/**
 * Possible status for a designation.
 */
export enum DesignationStatus {
  /**
   * The designation agreement status is designated
   */
  Designated = "Designated",
  /**
   * The designation agreement status is not designated
   */
  NotDesignated = "Not designated",
}
export class ScholasticStandingDataAPIInDTO {
  dateOfChange?: string;
  booksAndSupplies?: number;
  dateOfCompletion?: string;
  exceptionalCosts?: number;
  mandatoryFees?: number;
  tuition?: number;
  dateOfIncompletion?: string;
  dateOfWithdrawal?: string;
}

// This DTO must/will be validated using the dryRun.
export class ScholasticStandingAPIInDTO {
  @IsNotEmptyObject()
  data: ScholasticStandingDataAPIInDTO;
}
