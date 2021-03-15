import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateInstitutionDto {
  @IsNotEmpty()
  legalName: string;
  @IsOptional()
  operatingName: string;

  //TODO Can be broken into a different DTO
  //Institution Address
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

  //TODO Can be broken into a different DTO
  //Institution Mailing Address
  @IsNotEmpty()
  mailingAddressLine1: string;
  @IsOptional()
  mailingAddressLine2: string;
  @IsNotEmpty()
  mailingCity: string;
  @IsNotEmpty()
  mailingProvinceState: string;
  @IsNotEmpty()
  mailingCountry: string;
  @IsNotEmpty()
  mailingPostalCode: string;

  @IsNotEmpty()
  website: string;

  @IsNotEmpty()
  establishedDate: string;

  @IsNotEmpty()
  primaryPhone: string;
  @IsNotEmpty()
  primaryEmail: string;

  //TODO Can be broken into a different DTO
  // Legal Authority Contact Info
  @IsNotEmpty()
  legalAuthorityFirstName: string;

  @IsNotEmpty()
  legalAuthorityLastName: string;

  @IsNotEmpty()
  legalAuthorityEmail: string;

  @IsNotEmpty()
  legalAuthorityPhoneNumber: string;

  //TODO Can be broken into a different DTO
  //Institutions Primary Contact Information
  @IsNotEmpty()
  institutionPrimaryContactFirstName: string;

  @IsNotEmpty()
  institutionPrimaryContactLastName: string;

  @IsNotEmpty()
  institutionPrimaryContactEmail: string;

  @IsNotEmpty()
  institutionPrimaryContactPhone: string;

  //TODO Can be broken into a different DTO
  //Institution Regulating body that governs the institutions-
  @IsNotEmpty()
  institutionRegulatingBody: string;
}
