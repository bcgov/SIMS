export interface GetConfig {
  auth: AuthConfig;
}

export enum ClientIdType {
  Student = "student",
  Institution = "institution",
  AEST = "aest",
  SupportingUsers = "supportingUsers",
}

export interface AuthConfig {
  url: string;
  realm: string;
  clientIds: { [Value in ClientIdType]: string };
  externalSiteMinderLogoutUrl?: string;
}

export interface AppConfig {
  authConfig: AuthConfig;
  updateTime: Date;
}
