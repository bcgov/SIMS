import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  ValidateNested,
} from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { BCeIDDetailsDto } from "../../../route-controllers/user/models/bceid-account.dto";
import { Type } from "class-transformer";

import { DesignationStatus } from "../../../route-controllers/institution-locations/models/institution-location.dto";
import { AddressAPIInDTO, AddressAPIOutDTO } from "../../models/common.dto";

/**
 * DTO object for institution creation.
 */
export class InstitutionFormAPIInDTO {
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
  @IsOptional()
  regulatingBody: string;
  @IsDate()
  establishedDate: Date;
  //TODO Can be broken into a different DTO if needed
  //Institutions Primary Contact Information
  @IsNotEmpty()
  primaryContactFirstName: string;
  @IsNotEmpty()
  primaryContactLastName: string;
  @IsNotEmpty()
  primaryContactEmail: string;
  @IsNotEmpty()
  primaryContactPhone: string;
  //TODO Can be broken into a different DTO
  //Primary Institution Address
  @IsNotEmpty()
  addressLine1: string;
  @IsOptional()
  addressLine2: string;
  @IsNotEmpty()
  city: string;
  @IsNotEmpty()
  provinceState: string;
  @IsNotEmpty()
  country: string;
  @IsNotEmpty()
  postalCode: string;
  @IsPositive()
  institutionType: number;
}

export class InstitutionDto extends PartialType(InstitutionFormAPIInDTO) {
  @IsOptional()
  userEmail?: string;

  @IsOptional()
  userFirstName?: string;

  @IsOptional()
  userLastName?: string;

  @IsOptional()
  legalOperatingName?: string;

  @IsOptional()
  institutionTypeName: string;
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
  @Type(() => AddressAPIInDTO)
  mailingAddress: AddressAPIInDTO;
}

export class InstitutionContactAPIOutDTO {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  mailingAddress: AddressAPIOutDTO;
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

export interface InstitutionDetailDto {
  institution: InstitutionDto;
  account: BCeIDDetailsDto;
  isBCPrivate?: boolean;
}

export interface SearchInstitutionAPIOutDTO {
  id: number;
  legalName: string;
  operatingName: string;
  address: AddressAPIOutDTO;
}
