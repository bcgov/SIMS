export interface IConfig {
  auth: IAuthConfig;
}

export interface IAuthConfig {
  url: string;
  realm: string;
  clientIds: { [key: string] : string};
}
