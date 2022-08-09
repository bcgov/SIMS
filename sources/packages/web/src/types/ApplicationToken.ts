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

export interface BCSCParsedToken extends ApplicationToken {
  name: string;
  birthdate: string;
  givenNames: string;
  lastName: string;
  email: string;
  emailVerified: string;
  familyName: string;
  gender: string;
  givenName: string;
}

export interface BCeIDParsedToken extends ApplicationToken {
  givenNames: string;
  email: string;
}
