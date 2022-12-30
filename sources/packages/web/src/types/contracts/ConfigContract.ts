export interface ConfigAPIOutDTO {
  auth: AuthConfigAPIOutDTO;
}

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

export interface AuthConfigAPIOutDTO {
  url: string;
  realm: string;
  clientIds: { [Value in ClientIdType]: string };
  externalSiteMinderLogoutUrl?: string;
}

export interface AppConfig {
  authConfig: AuthConfigAPIOutDTO;
  updateTime: Date;
}
