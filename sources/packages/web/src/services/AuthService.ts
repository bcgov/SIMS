import Keycloak from "keycloak-js";
import store from "../store/index";
import { AppConfig } from "./AppConfigService";

let keycloak: Keycloak.KeycloakInstance;

export default async function(
  config: AppConfig
): Promise<Keycloak.KeycloakInstance> {
  if (keycloak) {
    return keycloak;
  }
  keycloak = Keycloak({
    url: config.authConfig.url,
    realm: config.authConfig.realm,
    clientId: config.authConfig.clientId
  });

  try {
    await keycloak.init({
      onLoad: "check-sso",
      responseMode: "query",
      checkLoginIframe: false
    });
    if (keycloak.authenticated) {
      store.dispatch("auth/login", keycloak);
    } else {
      store.dispatch("auth/logout");
    }
    
  } catch (excp) {
    console.log(`KC - init excp : ${excp}`);
  }
  keycloak.onTokenExpired = () => {
    console.log("onTokenExpired");
  };
  return keycloak;
}
