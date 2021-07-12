import { IsNotEmpty, IsOptional } from "class-validator";
export class GetStudentContactDto {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export class CreateStudentDto {
  @IsNotEmpty()
  phone: string;
  @IsNotEmpty()
  sinNumber: string;
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

export class UpdateStudentContactDto {
  @IsNotEmpty()
  phone: string;
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

export class ProgramYearDto {
  @IsNotEmpty()
  programYear: string;
  @IsNotEmpty()
  programYearDesc: string;
  @IsNotEmpty()
  formName: string;
}
