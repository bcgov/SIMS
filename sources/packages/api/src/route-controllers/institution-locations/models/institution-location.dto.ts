import { Allow, IsNotEmptyObject } from "class-validator";
import { InstitutionLocationInfo } from "../../../database/entities/institution-location.model";
import { AddressInfoAPIOutDTO } from "../../models/common.dto";

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
export class InstitutionLocationFormAPIInDTO {
  @Allow()
  addressLine1: string;
  @Allow()
  addressLine2?: string;
  @Allow()
  city: string;
  // This property has the country irrespective of the selectedCountry and otherCountry,
  // so for API purpose take country from this property.
  @Allow()
  country: string;
  @Allow()
  locationName: string;
  // This property has the postalCode irrespective of the selectedCountry and otherCountry,
  // so for API purpose take postalCode from this property.
  @Allow()
  postalCode: string;
  @Allow()
  provinceState: string;
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
  // This property will have canada postal code.
  // This property is for formio purpose.
  @Allow()
  canadaPostalCode?: string;
  // This property will have postal code for countries other than Canada.
  // This property is for formio purpose.
  @Allow()
  otherPostalCode?: string;
  // Dropdown value, it will have either "canada" or "other".
  // This property is for formio purpose.
  @Allow()
  selectedCountry?: string;
  // When "other" is selected in selectedCountry, then this property will have a value.
  // This property is for formio purpose.
  @Allow()
  otherCountry?: string;
}

/**
 * Response/Output DTO for institution location.
 */
export class InstitutionLocationFormAPIOutDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  locationName: string;
  postalCode: string;
  provinceState: string;
  institutionCode: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  canadaPostalCode?: string;
  otherPostalCode?: string;
  selectedCountry?: string;
  otherCountry?: string;
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
