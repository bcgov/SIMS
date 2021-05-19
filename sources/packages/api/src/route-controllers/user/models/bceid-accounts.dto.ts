export interface BCeIDAccountsDto {
  accounts: BCeIDAccountDto[];
}

export interface BCeIDAccountDto {
  guid: string;
  displayName: string;
  email: string;
  firstname: string;
  surname: string;
  telephone: string;
}
