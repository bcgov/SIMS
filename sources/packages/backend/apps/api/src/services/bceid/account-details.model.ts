export interface AccountDetails {
  user: UserDetails;
  institution: InstitutionDetails;
}

export interface UserDetails {
  guid: string;
  displayName: string;
  firstname: string;
  surname: string;
  email: string;
}

export interface InstitutionDetails {
  guid: string;
  legalName: string;
}
