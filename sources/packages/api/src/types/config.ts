export interface IConfig {
  auth: IAuthConfig;
}

export interface IAuthConfig {
  url: string;
  realm: string;
  clientId: string;
  issuerUrl: string;
}
