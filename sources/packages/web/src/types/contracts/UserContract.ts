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
