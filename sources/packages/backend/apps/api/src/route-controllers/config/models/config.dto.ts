export class ConfigAPIOutDTO {
  auth: AuthConfigAPIOutDTO;
  version: string;
  isFulltimeAllowed: boolean;
  maximumIdleTimeForWarningStudent: number;
  maximumIdleTimeForWarningSupportingUser: number;
  maximumIdleTimeForWarningInstitution: number;
  maximumIdleTimeForWarningAEST: number;
  appEnv: string;
}

export class AuthConfigAPIOutDTO {
  url: string;
  realm: string;
  clientIds: { [key: string]: string };
  externalSiteMinderLogoutUrl?: string;
}
