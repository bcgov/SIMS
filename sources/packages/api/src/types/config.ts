export interface IConfig {
  auth: IAuthConfig;
  e2eTest: Ie2eTest;
}

export interface IAuthConfig {
  url: string;
  realm: string;
  clientId: string;
  OpenIdConfigurationUrl: string;
}

export interface Ie2eTest {
  studentUser: IUserAndPasswordCredential;
}

export interface IUserAndPasswordCredential {
  username: string;
  password: string;
}
