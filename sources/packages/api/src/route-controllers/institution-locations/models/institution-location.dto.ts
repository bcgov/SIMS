import { Allow, IsEmail, IsNotEmpty, Length } from "class-validator";
import { InstitutionLocationData } from "../../../database/entities/institution-location.model";
import {
  AddressAPIOutDTO,
  AddressDetailsAPIInDTO,
  AddressDetailsAPIOutDTO,
} from "../../models/common.dto";

export class GetInstitutionLocationDto {
  id: number;
  data: InstitutionLocationData;
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

export class InstitutionLocationPrimaryContactAPIInDTO {
  @IsNotEmpty()
  primaryContactFirstName: string;
  @IsNotEmpty()
  primaryContactLastName: string;
  @IsEmail()
  primaryContactEmail: string;
  @Length(10, 20)
  primaryContactPhone: string;
}

export class AESTInstitutionLocationAPIInDTO extends AddressDetailsAPIInDTO {
  @IsNotEmpty()
  primaryContactFirstName: string;
  @IsNotEmpty()
  primaryContactLastName: string;
  @IsEmail()
  primaryContactEmail: string;
  @Length(10, 20)
  primaryContactPhone: string;
  @IsNotEmpty()
  locationName: string;
  @IsNotEmpty()
  institutionCode: string;
}

/**
 * Response/Output DTO for institution location.
 */
export class InstitutionLocationDetailsAPIOutDTO extends AddressDetailsAPIOutDTO {
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
    address: AddressAPIOutDTO;
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
