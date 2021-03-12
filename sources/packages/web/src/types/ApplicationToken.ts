import { KeycloakTokenParsed } from "keycloak-js";

export enum AppIDPType {
  BCeID = "BCEID",
  BCSC = "BCSC",
  UNKNOWN = "",
}

export interface ApplicationToken extends KeycloakTokenParsed {
  IDP: AppIDPType;
  userName: string;
  idp_user_name?: string;
}
