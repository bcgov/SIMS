export interface BCeIDDetailsDto {
  user: UserDetailsDto;
  institution: InstitutionDetailsDto;
}

export interface UserDetailsDto {
  guid: string;
  displayName: string;
  firstname: string;
  surname: string;
  email: string;
}

export interface InstitutionDetailsDto {
  guid: string;
  legalName: string;
}
