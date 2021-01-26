export interface GetConfig {
  auth: AuthConfig
}

export interface AuthConfig {
  url: string,
  realm: string,
  clientId: string
}