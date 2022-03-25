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

import { DesignationLocationAgreementStatus } from "../../../route-controllers/institution-locations/models/institution-location.dto";

/**
 * DTO object for institution creation.
 */
export class CreateInstitutionDto {
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
  @IsNotEmpty()
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
  @IsNotEmpty()
  institutionType: number;
}

export class InstitutionDto extends PartialType(CreateInstitutionDto) {
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
export class InstitutionAddress {
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
}

export class InstitutionContactDTO {
  @IsNotEmpty()
  primaryContactEmail: string;
  @IsNotEmpty()
  primaryContactFirstName: string;
  @IsNotEmpty()
  primaryContactLastName: string;
  @IsNotEmpty()
  primaryContactPhone: string;
  @ValidateNested()
  @Type(() => InstitutionAddress)
  mailingAddress: InstitutionAddress;
}

export class InstitutionProfileDTO extends InstitutionContactDTO {
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

export class InstitutionDetailDTO extends InstitutionProfileDTO {
  legalOperatingName: string;
  formattedEstablishedDate?: string;
  institutionTypeName?: string;
  isBCPrivate?: boolean;
}

export interface BasicInstitutionInfo {
  operatingName: string;
  designationAgreementLocationStatus: DesignationLocationAgreementStatus;
}

export interface InstitutionDetailDto {
  institution: InstitutionDto;
  account: BCeIDDetailsDto;
  isBCPrivate?: boolean;
}

export interface SearchInstitutionRespDto {
  id: number;
  legalName: string;
  operatingName: string;
  address: InstitutionAddress;
}
