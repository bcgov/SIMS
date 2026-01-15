import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { OmitType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { DesignationStatus } from "../../../route-controllers/institution-locations/models/institution-location.dto";
import {
  AddressDetailsAPIInDTO,
  AddressAPIOutDTO,
  AddressDetailsAPIOutDTO,
} from "../../models/common.dto";
import {
  OPERATING_NAME_MAX_LENGTH,
  LEGAL_OPERATING_NAME_MAX_LENGTH,
} from "@sims/sims-db";
import { OTHER_REGULATING_BODY_MAX_LENGTH } from "../../../constants";

/**
 * DTO for institution creation by the institution user during the on board process
 * when the institution profile and the admin user must be created altogether.
 */
export class CreateInstitutionAPIInDTO {
  @IsNotEmpty()
  userEmail: string;
  @IsOptional()
  operatingName: string;
  @IsNotEmpty()
  primaryPhone: string;
  @IsNotEmpty()
  primaryEmail: string;
  @IsNotEmpty()
  website: string;
  @IsNotEmpty()
  regulatingBody: string;
  @ValidateIf((e) => e.regulatingBody === "other")
  @IsNotEmpty()
  @MaxLength(OTHER_REGULATING_BODY_MAX_LENGTH)
  otherRegulatingBody: string;
  @IsDateString()
  establishedDate: string;
  @IsPositive()
  institutionType: number;
  //Institutions Primary Contact Information
  @IsNotEmpty()
  primaryContactFirstName: string;
  @IsNotEmpty()
  primaryContactLastName: string;
  @IsNotEmpty()
  primaryContactEmail: string;
  @IsNotEmpty()
  primaryContactPhone: string;
  @ValidateNested()
  @Type(() => AddressDetailsAPIInDTO)
  mailingAddress: AddressDetailsAPIInDTO;
}

/**
 * Ministry user institution creation. No user information is provided and
 * user related information (e.g. userEmail) is not needed. Besides that,
 * the Ministry user should be able to provide all data needed to create
 * the institution.
 */
export class AESTCreateInstitutionFormAPIInDTO extends OmitType(
  CreateInstitutionAPIInDTO,
  ["userEmail"],
) {
  @IsNotEmpty()
  legalOperatingName: string;
}

export class InstitutionContactAPIInDTO {
  @IsNotEmpty()
  primaryContactEmail: string;
  @IsNotEmpty()
  primaryContactFirstName: string;
  @IsNotEmpty()
  primaryContactLastName: string;
  @IsNotEmpty()
  primaryContactPhone: string;
  @ValidateNested()
  @Type(() => AddressDetailsAPIInDTO)
  mailingAddress: AddressDetailsAPIInDTO;
}

export class InstitutionContactAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: AddressDetailsAPIOutDTO;
}

export class InstitutionProfileAPIInDTO extends InstitutionContactAPIInDTO {
  @IsNotEmpty()
  operatingName: string;
  @IsNotEmpty()
  primaryPhone: string;
  @IsNotEmpty()
  primaryEmail: string;
  @IsNotEmpty()
  website: string;
  @IsNotEmpty()
  regulatingBody: string;
  @ValidateIf((e) => e.regulatingBody === "other")
  @IsNotEmpty()
  @MaxLength(OTHER_REGULATING_BODY_MAX_LENGTH)
  otherRegulatingBody: string;
  @IsDateString()
  establishedDate: string;
  @IsPositive()
  institutionType: number;
}

export class InstitutionProfileAPIOutDTO extends InstitutionContactAPIOutDTO {
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  otherRegulatingBody?: string;
  establishedDate: string;
  institutionType: number;
}

export class InstitutionDetailAPIOutDTO extends InstitutionProfileAPIOutDTO {
  legalOperatingName: string;
  institutionTypeName?: string;
  isBCPrivate: boolean;
  isBCPublic: boolean;
  /**
   * Indicates if the institution has a BCeID business guid
   * associated with, if not it is a basic BCeID institution.
   */
  hasBusinessGuid: boolean;
}

export class InstitutionBasicAPIOutDTO {
  operatingName: string;
  designationStatus: DesignationStatus;
  /**
   * Indicates if the institution has a BCeID business guid
   * associated with, if not it is a basic BCeID institution.
   */
  hasBusinessGuid: boolean;
  hasRestrictions: boolean;
}

export class SearchInstitutionAPIOutDTO {
  id: number;
  legalName: string;
  operatingName: string;
  address: AddressAPIOutDTO;
}

export class SearchInstitutionQueryAPIInDTO {
  @ValidateIf(
    (input: SearchInstitutionQueryAPIInDTO) =>
      !!(input.legalName || !input.operatingName),
  )
  @IsNotEmpty()
  @MaxLength(LEGAL_OPERATING_NAME_MAX_LENGTH)
  legalName?: string;
  @ValidateIf(
    (input: SearchInstitutionQueryAPIInDTO) =>
      !!(input.operatingName || !input.legalName),
  )
  @IsNotEmpty()
  @MaxLength(OPERATING_NAME_MAX_LENGTH)
  operatingName?: string;
}
