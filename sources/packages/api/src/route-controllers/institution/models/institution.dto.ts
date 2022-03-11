import { IsNotEmpty, IsOptional } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { BCeIDDetailsDto } from "../../../route-controllers/user/models/bceid-account.dto";
import { ClientTypeBaseRoute } from "../../../types";

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

export class InstitutionContactDto {
  primaryContactEmail: string;
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactPhone: string;
  address: InstitutionAddress;
}

export class InstitutionProfileDto extends InstitutionContactDto {
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  establishedDate: Date;
  institutionType: number;
}

export class InstitutionReadOnlyDto extends InstitutionProfileDto {
  legalOperatingName: string;
  formattedEstablishedDate: string;
  institutionTypeName: string;
  clientType: ClientTypeBaseRoute;
}

export interface BasicInstitutionInfo {
  operatingName: string;
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

export class InstitutionAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}
