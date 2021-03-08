export type ClientType = "student" | "institute";

export interface IConfig {
  auth: IAuthConfig;
}

export interface IAuthConfig {
  url: string;
  realm: string;
  clientIds: {[K in ClientType]: string};
  openIdConfigurationUrl: string;
}
