import { OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from "class-validator";
import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "../../../auth/user-types.enum";
import { AddressAPIOutDTO } from "../../../route-controllers/models/common.dto";

export class UserPermissionInDTO {
  @IsOptional()
  locationId?: number;
  @IsNotEmpty()
  @IsEnum(InstitutionUserTypes)
  userType: InstitutionUserTypes;
  @IsOptional()
  @IsEnum(InstitutionUserRoles)
  @IsIn(Object.values(InstitutionUserRoles))
  userRole?: InstitutionUserRoles;
}

/**
 * Associates a new user from BCeID with an institution
 * associating also the authorizations.
 */
export class CreateInstitutionUserAPIInDTO {
  /**
   * User BCeID id from BCeID Web Service (e.g. SomeUserName) that will have its
   * data retrieved to be created on SIMS.
   */
  @IsNotEmpty()
  userId: string;
  /**
   * Permissions to be associated with the new user.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => UserPermissionInDTO)
  permissions: UserPermissionInDTO[];
}

/**
 * Update an existing user association with an institution
 * changing the authorizations.
 */
export class UpdateInstitutionUserAPIInDTO extends OmitType(
  CreateInstitutionUserAPIInDTO,
  ["userId"],
) {}

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
