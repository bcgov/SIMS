import { User } from "../../../database/entities";

export interface InstitutionUserRespDto {
  id: number;
  user: Pick<User, "email" | "firstName" | "lastName" | "userName">;
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
