import { IsNotEmpty, IsOptional } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { BCeIDDetailsDto } from "../../../route-controllers/user/models/bceid-account.dto";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO object for institution creation.
 */
export class CreateInstitutionDto {
  @ApiProperty()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty()
  @IsOptional()
  operatingName: string;

  @ApiProperty()
  @IsNotEmpty()
  primaryPhone: string;

  @ApiProperty()
  @IsNotEmpty()
  primaryEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  website: string;

  @ApiProperty()
  @IsOptional()
  regulatingBody: string;

  @ApiProperty()
  @IsNotEmpty()
  establishedDate: Date;

  //TODO Can be broken into a different DTO if needed
  //Institutions Primary Contact Information
  @ApiProperty()
  @IsNotEmpty()
  primaryContactFirstName: string;

  @ApiProperty()
  @IsNotEmpty()
  primaryContactLastName: string;

  @ApiProperty()
  @IsNotEmpty()
  primaryContactEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  primaryContactPhone: string;

  //TODO Can be broken into a different DTO if needed
  // Legal Authority Contact Info
  @ApiProperty()
  @IsNotEmpty()
  legalAuthorityFirstName: string;

  @ApiProperty()
  @IsNotEmpty()
  legalAuthorityLastName: string;

  @ApiProperty()
  @IsNotEmpty()
  legalAuthorityEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  legalAuthorityPhone: string;

  //TODO Can be broken into a different DTO
  //Primary Institution Address
  @ApiProperty()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty()
  @IsOptional()
  addressLine2: string;

  @ApiProperty()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  provinceState: string;

  @ApiProperty()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty()
  @IsNotEmpty()
  institutionType: number;
}

export class InstitutionDto extends PartialType(CreateInstitutionDto) {
  @ApiProperty()
  @IsOptional()
  userEmail?: string;

  @ApiProperty()
  @IsOptional()
  userFirstName?: string;

  @ApiProperty()
  @IsOptional()
  userLastName?: string;

  @ApiProperty()
  @IsOptional()
  legalOperatingName?: string;

  @ApiProperty()
  @IsOptional()
  institutionTypeName: string;
}

export class AESTInstitutionDetailDto {
  @ApiProperty()
  legalOperatingName: string;
  @ApiProperty()
  operatingName: string;
  @ApiProperty()
  primaryPhone: string;
  @ApiProperty()
  primaryEmail: string;
  @ApiProperty()
  website: string;
  @ApiProperty()
  regulatingBody: string;
  @ApiProperty()
  institutionTypeName: string;
  @ApiProperty()
  formattedEstablishedDate: string;
  @ApiProperty()
  primaryContactEmail: string;
  @ApiProperty()
  primaryContactFirstName: string;
  @ApiProperty()
  primaryContactLastName: string;
  @ApiProperty()
  primaryContactPhone: string;
  @ApiProperty()
  legalAuthorityEmail: string;
  @ApiProperty()
  legalAuthorityFirstName: string;
  @ApiProperty()
  legalAuthorityLastName: string;
  @ApiProperty()
  legalAuthorityPhone: string;
  @ApiProperty()
  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    country: string;
    provinceState: string;
    postalCode: string;
  };
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

export interface InstitutionAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}
