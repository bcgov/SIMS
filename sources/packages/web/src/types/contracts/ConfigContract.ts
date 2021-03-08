export interface GetConfig {
  auth: AuthConfig;
}

export type ClientIdType = "student" | "institute";

export interface AuthConfig {
  url: string;
  realm: string;
  clientIds: {[K in ClientIdType] : string};
}

export interface AppConfig {
  authConfig: AuthConfig;
  updateTime: Date;
}
