import {
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  User,
} from "src/database/entities";
import { InstitutionLocation } from "src/database/entities/institution-location.model";
import { UserInfo } from "../../../types";

export interface InstitutionUserRespDto {
  id?: number;
  user: Pick<User, "email" | "firstName" | "lastName" | "userName">;
  authorizations: {
    id?: number;
    authType: {
      role?: string;
      type: string;
    };
    location?: string;
  }[];
}
