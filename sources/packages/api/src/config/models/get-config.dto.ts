export interface GetConfig {
  keyCloak: KeyCloakConfig
}

export interface KeyCloakConfig {
  url: string,
  realm: string,
  client: string
}