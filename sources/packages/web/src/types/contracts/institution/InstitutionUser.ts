export interface InstitutionUserResDto {
  id: number;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    userName: string;
  };
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

export interface InstitutionUserViewModel {
  id: number;
  email: string;
  userName: string;
  displayName: string;
  location: string;
  userType: string;
  role: string;
  status?: "active"; //TODO: Putting default value here, later replace with proper field
  disableRemove?: boolean;
}
