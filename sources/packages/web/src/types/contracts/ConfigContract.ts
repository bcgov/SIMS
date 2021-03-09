export interface GetConfig {
  auth: AuthConfig;
}

export enum ClientIdType {
  STUDENT = "student",
  INSTITUTE = "institute"
}

export interface AuthConfig {
  url: string;
  realm: string;
  clientIds: {[Value in ClientIdType] : string};
}

export interface AppConfig {
  authConfig: AuthConfig;
  updateTime: Date;
}
