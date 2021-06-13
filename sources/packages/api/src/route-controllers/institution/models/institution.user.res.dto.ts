import {
  User,
  InstitutionLocation,
  InstitutionUserTypeAndRole,
} from "../../../database/entities";
import { InstitutionUserAuthorizations as InstitutionUserAuth } from "../../../services/institution-user-auth/institution-user-auth.models";

export interface InstitutionUserRespDto {
  id: number;
  user: Pick<
    User,
    "email" | "firstName" | "lastName" | "userName" | "isActive"
  >;
  authorizations: {
    id: number;
    authType: {
      role?: string;
      type: string;
    };
    location?: {
      name: string;
    };
  }[];
}
export interface InstitutionUserAuthorizations {
  location?: Pick<InstitutionLocation, "name" | "data" | "id">;
  authType: Pick<InstitutionUserTypeAndRole, "type" | "role">;
}
export interface InstitutionLocationUserAuthDto {
  id: number;
  authorizations: InstitutionUserAuthorizations[];
  user: Pick<User, "firstName" | "lastName" | "userName" | "isActive" | "id">;
}

export interface InstitutionUserAndAuthDetails {
  authorizations: InstitutionUserAuth;
  user: Pick<
    User,
    "firstName" | "lastName" | "userName" | "isActive" | "id" | "email"
  >;
}
