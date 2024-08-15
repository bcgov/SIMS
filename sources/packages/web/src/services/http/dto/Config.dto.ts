import { ClientIdType } from "@/types";

export interface AuthConfigAPIOutDTO {
  url: string;
  realm: string;
  clientIds: { [Value in ClientIdType]: string };
  externalSiteMinderLogoutUrl?: string;
}

export interface ConfigAPIOutDTO {
  auth: AuthConfigAPIOutDTO;
  version: string;
  isFulltimeAllowed: boolean;
  maximumIdleTimeForWarningStudent: number;
  maximumIdleTimeForWarningSupportingUser: number;
  maximumIdleTimeForWarningInstitution: number;
  maximumIdleTimeForWarningAEST: number;
}
