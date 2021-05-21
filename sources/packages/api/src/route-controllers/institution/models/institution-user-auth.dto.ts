import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { InstitutionUserType, InstitutionUserRole } from "../../../types";

export class InstitutionUserAuthDto {
  @IsNotEmpty()
  userGuid: string;

  @IsOptional()
  locationId?: number;

  @IsNotEmpty()
  @IsIn(Object.values(InstitutionUserType))
  userType: string;

  @IsOptional()
  @IsIn(Object.values(InstitutionUserRole))
  userRole?: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
