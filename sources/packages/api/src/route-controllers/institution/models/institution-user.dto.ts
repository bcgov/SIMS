import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { InstitutionUserType, InstitutionUserRole } from "../../../types";

export class InstitutionUserAPIInDTO {
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => UserPermissionInDTO)
  permissions: UserPermissionInDTO[];
}

export class UserPermissionInDTO {
  @IsOptional()
  locationId?: number;

  @IsNotEmpty()
  @IsIn(Object.values(InstitutionUserType))
  userType: string;

  @IsOptional()
  @IsIn(Object.values(InstitutionUserRole))
  userRole?: string;
}

export class InstitutionUserPermissionAPIInDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => UserPermissionInDTO)
  permissions: UserPermissionInDTO[];
}

export class UserActiveStatusAPIInDTO {
  @IsBoolean()
  isActive: boolean;
}

export class InstitutionUserAuthTypeOutDTO {
  role?: string;
  type: string;
}

export class InstitutionAuthLocationOutDTO {
  name: string;
}

export class InstitutionUserAuthOutDTO {
  id?: number;
  authType: InstitutionUserAuthTypeOutDTO;
  location?: InstitutionAuthLocationOutDTO;
}

export class InstitutionUserSummaryOutDTO {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  isActive: boolean;
}

export class InstitutionUserAPIOutDTO {
  id: number;
  user: InstitutionUserSummaryOutDTO;
  authorizations: InstitutionUserAuthOutDTO[];
}
