import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { InstitutionUserType, InstitutionUserRole } from "../../../types";

export class InstitutionUserAuthDto {
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => UserPermissionDto)
  permissions: UserPermissionDto[];
}

export class UserPermissionDto {
  @IsOptional()
  locationId?: number;

  @IsNotEmpty()
  @IsIn(Object.values(InstitutionUserType))
  userType: string;

  @IsOptional()
  @IsIn(Object.values(InstitutionUserRole))
  userRole?: string;
}
