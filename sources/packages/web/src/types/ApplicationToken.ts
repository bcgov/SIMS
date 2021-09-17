import { KeycloakTokenParsed } from "keycloak-js";

export enum AppIDPType {
  BCeID = "BCEID",
  BCSC = "BCSC",
  IDIR = "IDIR",
  UNKNOWN = "",
}

export interface ApplicationToken extends KeycloakTokenParsed {
  IDP: AppIDPType;
  userName: string;
  /**
   * Authorized Party.
   */
  azp: string;
}
