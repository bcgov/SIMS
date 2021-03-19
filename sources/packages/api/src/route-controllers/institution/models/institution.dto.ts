import { IsNotEmpty, IsOptional } from "class-validator";

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
  establishedDate: string;

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
}
