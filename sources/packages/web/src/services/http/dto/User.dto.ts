export interface BCeIDDetailsAPIOutDTO {
  user: UserDetailsAPIOutDTO;
  institution: InstitutionLocationDetailsAPIOutDTO;
}

export interface UserDetailsAPIOutDTO {
  guid: string;
  displayName: string;
  firstname: string;
  surname: string;
  email: string;
}

export interface InstitutionLocationDetailsAPIOutDTO {
  guid: string;
  legalName: string;
}

export interface BCeIDAccountAPIOutDTO {
  displayName: string;
  email: string;
  firstname: string;
  userId: string;
  guid: string;
  surname: string;
  telephone?: string;
}

export interface BCeIDAccountsAPIOutDTO {
  accounts: BCeIDAccountAPIOutDTO[];
}

export interface InstitutionUserDetailsAPIOutDTO {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

export interface InstitutionUserPersistAPIInDTO {
  userEmail: string;
}
