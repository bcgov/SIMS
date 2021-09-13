export interface GetConfig {
  auth: AuthConfig;
}

export enum ClientIdType {
  STUDENT = "student",
  INSTITUTION = "institution",
  AEST = "aest",
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
