import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsPositive,
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
  @IsDate()
  establishedDate: Date;
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
  @IsDate()
  establishedDate: Date;
  @IsPositive()
  institutionType: number;
}

export class InstitutionProfileAPIOutDTO extends InstitutionContactAPIOutDTO {
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  establishedDate: Date;
  institutionType: number;
}

export class InstitutionDetailAPIOutDTO extends InstitutionProfileAPIOutDTO {
  legalOperatingName: string;
  formattedEstablishedDate?: string;
  institutionTypeName?: string;
  isBCPrivate?: boolean;
}

export class InstitutionBasicAPIOutDTO {
  operatingName: string;
  designationStatus: DesignationStatus;
}

export class SearchInstitutionAPIOutDTO {
  id: number;
  legalName: string;
  operatingName: string;
  address: AddressAPIOutDTO;
}
