import { IsIn, IsNotEmpty, IsOptional } from "class-validator";
import { InstitutionUserType, InstitutionUserRole } from "../../../types";

export class InstitutionUserAuthDto {
  @IsNotEmpty()
  guid: string;

  @IsOptional()
  locationId?: number;

  @IsNotEmpty()
  @IsIn(Object.values(InstitutionUserType))
  userType: string;

  @IsOptional()
  @IsIn(Object.values(InstitutionUserRole))
  userRole?: string;
}
