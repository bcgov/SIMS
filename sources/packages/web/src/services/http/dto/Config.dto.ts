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
  allowBetaInstitutionsOnly: boolean;
  maximumIdleTimeForWarningStudent: number;
  maximumIdleTimeForWarningSupportingUser: number;
  maximumIdleTimeForWarningInstitution: number;
  maximumIdleTimeForWarningAEST: number;
  applicationSubmissionDeadlineWeeks: number;
  appEnv: string;
  queueDashboardURL: string;
  maintenanceMode: boolean;
  maintenanceModeStudent: boolean;
  maintenanceModeInstitution: boolean;
  maintenanceModeMinistry: boolean;
  maintenanceModeSupportingUser: boolean;
  maintenanceModeExternal: boolean;
}
