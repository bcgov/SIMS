import Keycloak from "keycloak-js";
import store from "../store/index";
import { AppConfig, ClientIdType } from "../types/contracts/ConfigContract";

let keycloak: Keycloak.KeycloakInstance;

export default async function(
  config: AppConfig,
  type: ClientIdType,
): Promise<Keycloak.KeycloakInstance> {
  if (keycloak) {
    return keycloak;
  }
  keycloak = Keycloak({
    url: config.authConfig.url,
    realm: config.authConfig.realm,
    clientId: config.authConfig.clientIds[type],
  });

  try {
    await keycloak.init({
      onLoad: "check-sso",
      responseMode: "query",
      checkLoginIframe: false,
    });
    if (keycloak.authenticated) {
      switch (type) {
        case ClientIdType.STUDENT:
          store.dispatch("student/setStudentProfileData", keycloak);
          break;
        case ClientIdType.INSTITUTION:
          console.log(
            `After Authenticating Keycloak Institution User ${keycloak.tokenParsed}`,
          );
      }
    }
  } catch (excp) {
    console.error(`KC - init excp : ${excp} - ${type}`);
  }
  keycloak.onTokenExpired = () => {
    store.dispatch("auth/logout");
  };
  return keycloak;
}
