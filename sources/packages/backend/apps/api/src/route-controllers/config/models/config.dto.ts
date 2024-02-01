export class ConfigAPIOutDTO {
  auth: AuthConfigAPIOutDTO;
  version: string;
  isFulltimeAllowed: boolean;
}

export class AuthConfigAPIOutDTO {
  url: string;
  realm: string;
  clientIds: { [key: string]: string };
  externalSiteMinderLogoutUrl?: string;
}
