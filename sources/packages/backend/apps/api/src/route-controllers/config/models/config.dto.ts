export class ConfigAPIOutDTO {
  auth: AuthConfigAPIOutDTO;
  version: string;
}

export class AuthConfigAPIOutDTO {
  url: string;
  realm: string;
  clientIds: { [key: string]: string };
  externalSiteMinderLogoutUrl?: string;
}
