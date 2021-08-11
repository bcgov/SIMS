export interface BCeIDDetailsDto {
  user: UserDetailsDto;
  institution: InstitutionAccountDetailsDto;
}

export interface UserDetailsDto {
  guid: string;
  displayName: string;
  firstname: string;
  surname: string;
  email: string;
}

export interface InstitutionAccountDetailsDto {
  guid: string;
  legalName: string;
}

export interface BCeIDAccountDto {
  displayName: string;
  email: string;
  firstname: string;
  guid: string;
  surname: string;
  telephone?: string;
}
export interface BCeIDAccountsDto {
  accounts: BCeIDAccountDto[];
}

export interface InstitutionUserDetailsDto {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}
