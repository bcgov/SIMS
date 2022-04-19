import { User, InstitutionUser } from "../../../database/entities";
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

export interface InstitutionUserAuth {
  institutionId: number;
  authorizations: {
    locationId?: number;
    userType: string;
    userRole?: string;
  }[];
}
export interface InstitutionUserAndAuthDetailsDto {
  authorizations: InstitutionUserAuth;
  user: {
    isAdmin: boolean;
    firstName: string;
    lastName: string;
    userFullName: string;
    isActive: boolean;
    email: string;
  };
}

export interface InstitutionUsersListWithTotalCount {
  users: InstitutionUser[];
  totalUsers: number;
}

export interface InstitutionUserAndCount {
  users: InstitutionUserRespDto[];
  totalUsers: number;
}
