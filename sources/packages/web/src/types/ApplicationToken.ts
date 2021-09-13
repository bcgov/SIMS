import { KeycloakTokenParsed } from "keycloak-js";

export enum AppIDPType {
  BCeID = "BCEID",
  BCSC = "BCSC",
  UNKNOWN = "",
}

export interface ApplicationToken extends KeycloakTokenParsed {
  userName: string;
  /**
   * Authorized Party.
   */
  azp: string;
}
