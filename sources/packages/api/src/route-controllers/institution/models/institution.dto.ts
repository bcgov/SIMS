import { IsNotEmpty, IsOptional } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { BCeIDDetailsDto } from "../../../route-controllers/user/models/bceid-account.dto";
import { Institution } from "../../../database/entities";

export class CreateInstitutionDto {
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

  //TODO Can be broken into a different DTO if needed
  // Legal Authority Contact Info
  @IsNotEmpty()
  legalAuthorityFirstName: string;

  @IsNotEmpty()
  legalAuthorityLastName: string;

  @IsNotEmpty()
  legalAuthorityEmail: string;

  @IsNotEmpty()
  legalAuthorityPhone: string;

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
  institutionType: string;
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

  static fromEntity(institutionEntity: Institution): InstitutionDto {
    return {
      legalOperatingName: institutionEntity.legalOperatingName,
      operatingName: institutionEntity.operatingName,
      primaryPhone: institutionEntity.primaryPhone,
      primaryEmail: institutionEntity.primaryEmail,
      website: institutionEntity.website,
      regulatingBody: institutionEntity.regulatingBody,
      establishedDate: institutionEntity.establishedDate,
      primaryContactEmail:
        institutionEntity.institutionPrimaryContact.primaryContactEmail,
      primaryContactFirstName:
        institutionEntity.institutionPrimaryContact.primaryContactFirstName,
      primaryContactLastName:
        institutionEntity.institutionPrimaryContact.primaryContactLastName,
      primaryContactPhone:
        institutionEntity.institutionPrimaryContact.primaryContactPhone,
      legalAuthorityEmail:
        institutionEntity.legalAuthorityContact.legalAuthorityEmail,
      legalAuthorityFirstName:
        institutionEntity.legalAuthorityContact.legalAuthorityFirstName,
      legalAuthorityLastName:
        institutionEntity.legalAuthorityContact.legalAuthorityLastName,
      legalAuthorityPhone:
        institutionEntity.legalAuthorityContact.legalAuthorityPhone,
      addressLine1: institutionEntity.institutionAddress.addressLine1,
      addressLine2: institutionEntity.institutionAddress.addressLine2,
      city: institutionEntity.institutionAddress.city,
      country: institutionEntity.institutionAddress.country,
      provinceState: institutionEntity.institutionAddress.provinceState,
      postalCode: institutionEntity.institutionAddress.postalCode,
      institutionType: institutionEntity.institutionType.name.trim(),
    };
  }
}

export interface InstitutionDetailDto {
  institution: InstitutionDto;
  account: BCeIDDetailsDto;
}
