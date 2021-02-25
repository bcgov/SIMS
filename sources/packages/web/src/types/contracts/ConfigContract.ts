export interface GetConfig {
  auth: AuthConfig;
}

export interface AuthConfig {
  url: string;
  realm: string;
  clientId: string;
}

export interface AppConfig {
  authConfig: {
    url: string;
    realm: string;
    clientId: string;
  };
  updateTime: Date;
}
