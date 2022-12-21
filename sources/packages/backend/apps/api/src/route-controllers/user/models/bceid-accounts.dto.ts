export class BCeIDAccountsAPIOutDTO {
  accounts: BCeIDAccountAPIOutDTO[];
}

export class BCeIDAccountAPIOutDTO {
  guid: string;
  displayName: string;
  email: string;
  firstname: string;
  surname: string;
  telephone: string;
  userId: string;
}
