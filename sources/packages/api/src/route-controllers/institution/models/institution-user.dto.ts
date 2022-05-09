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
import { AddressAPIOutDTO } from "../../../route-controllers/models/common.dto";
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

export class InstitutionUserAuthTypeAPIOutDTO {
  role?: string;
  type: string;
}

export class InstitutionLocationAuthDataAPIOutDTO {
  address: AddressAPIOutDTO;
}

export class InstitutionAuthLocationAPIOutDTO {
  id?: number;
  name: string;
  data?: InstitutionLocationAuthDataAPIOutDTO;
}

export class InstitutionUserAuthAPIOutDTO {
  id?: number;
  authType: InstitutionUserAuthTypeAPIOutDTO;
  location?: InstitutionAuthLocationAPIOutDTO;
}

export class InstitutionUserSummaryAPIOutDTO {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  userName?: string;
  isActive: boolean;
  userFullName?: string;
}

export class InstitutionUserAPIOutDTO {
  id?: number;
  user: InstitutionUserSummaryAPIOutDTO;
  authorizations: InstitutionUserAuthAPIOutDTO[];
}

export class InstitutionLocationAuthAPIOutDTO {
  locationId: number;
  userType: string;
  userRole: string;
}

export class UserAuthDetailAPIOutDTO {
  institutionId: number;
  authorizations: InstitutionLocationAuthAPIOutDTO[];
}

export class InstitutionUserDetailAPIOutDTO {
  id?: number;
  user: InstitutionUserSummaryAPIOutDTO;
  authorizations: UserAuthDetailAPIOutDTO;
}

export class InstitutionUserLocationsAPIOutDTO {
  id: number;
  name: string;
  address: AddressAPIOutDTO;
}

/**
 * DTO To load the admin roles dropdown component
 */
export class UserRoleOptionAPIOutDTO {
  name: string;
  code: string;
}

export class InstitutionUserTypeAndRoleAPIOutDTO {
  userTypes: string[];
  userRoles: string[];
}
