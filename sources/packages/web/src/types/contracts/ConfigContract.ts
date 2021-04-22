export interface GetConfig {
  auth: AuthConfig;
}

export enum ClientIdType {
  STUDENT = "student",
  INSTITUTION = "institution",
}

export interface AuthConfig {
  url: string;
  realm: string;
  clientIds: { [Value in ClientIdType]: string };
  externalLogoutUrl?: string;
}

export interface AppConfig {
  authConfig: AuthConfig;
  updateTime: Date;
}
