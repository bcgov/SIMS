import Keycloak from "keycloak-js";
import store from "../store/index";
import { AppConfig, ClientIdType } from "../types/contracts/ConfigContract";
import HttpBaseClient from "./http/common/HttpBaseClient";
import { UserService } from "./UserService";
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
    console.log("Initializing Auth Service");
    await keycloak.init({
      onLoad: "check-sso",
      responseMode: "query",
      checkLoginIframe: false,
    });

    console.log(`keycloak.authenticated ${keycloak.authenticated}`);
    if (keycloak.authenticated) {
      console.log("In AUth Service Client Type Insti 1");
      switch (type) {
        case ClientIdType.STUDENT:
          store.dispatch("student/setStudentProfileData", keycloak);
          break;
        case ClientIdType.INSTITUTION: {
          console.log("In AUth Service Client Type Insti 2");

          const authHeader = HttpBaseClient.createAuthHeader(keycloak.token);
          const bceIdAccountDetails = await UserService.shared.getBCeIDAccountDetails(
            authHeader,
          );
          console.dir(bceIdAccountDetails);
          if (!bceIdAccountDetails.user) {
            console.log("It is a Basic User");
            const url = keycloak.createLoginUrl();

            const redirectUrl = url
              .substring(url.indexOf("?") + 1)
              .split("&")[1]
              .split("=")[1]
              .concat("/basicBCeID");

            console.log(`keycloak.redirectUri is ${redirectUrl}`);
            await keycloak.logout({
              redirectUri: redirectUrl,
            });
            //keycloak.loginRequired = true;
          }
        }
      } //Switch case ends
    }
  } catch (excp) {
    console.dir(excp);
    console.error(`KC - init excp : ${excp} - ${type}`);
  }
  keycloak.onTokenExpired = () => {
    store.dispatch("auth/logout");
  };
  return keycloak;
}
