import { AuthConfigAPIOutDTO } from "@/services/http/dto";

export enum ClientIdType {
  Student = "student",
  Institution = "institution",
  AEST = "aest",
  SupportingUsers = "supportingUsers",
}

export enum ClientTypeBaseRoute {
  Student = "students",
  Institution = "institutions",
  AEST = "aest",
  SupportingUser = "supporting-users",
}

export interface AppConfig {
  authConfig: AuthConfigAPIOutDTO;
  updateTime: Date;
  version: string;
  isFulltimeAllowed: boolean;
  maximumIdleTimeForWarningStudent: number;
  maximumIdleTimeForWarningSupportingUser: number;
  maximumIdleTimeForWarningInstitution: number;
  maximumIdleTimeForWarningAest: number;
}
