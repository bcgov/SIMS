export interface IConfig {
  auth: IAuthConfig;
  bceid: BCeIDConfig;
}

export interface IAuthConfig {
  url: string;
  realm: string;
  clientId: string;
  openIdConfigurationUrl: string;
}

export interface BCeIDConfig {
  wsdlEndpoint: string;
  onlineServiceId: string;
  requesterUserGuid: string;
  credential: UserPasswordCredential;
}

export interface UserPasswordCredential {
  userName: string;
  password: string;
}
