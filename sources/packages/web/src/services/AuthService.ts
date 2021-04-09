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
    console.log("returning existing keycloak");
    return keycloak;
  }
  console.log("creating new keycloak");
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
        case ClientIdType.INSTITUTION: {
          const authHeader = HttpBaseClient.createAuthHeader(keycloak.token);
          const bceIdAccountDetails = await UserService.shared.getBCeIDAccountDetails(
            authHeader,
          );
          if (!bceIdAccountDetails.user) {
            const url = keycloak.createLoginUrl();
            //query params ?basicBCeID=true is going to be used in Login.vue to
            //show a corresponding message to the user
            const redirectUrl = decodeURIComponent(
              url
                .substring(url.indexOf("?") + 1)
                .split("&")[1]
                .split("=")[1]
                .concat("?basicBCeID=true"),
            );

            await keycloak.logout({
              redirectUri: redirectUrl,
            });
          }
        } //Institution switch case ends
      } //Switch block ends
    } //KeyCloak Authenticate = true
  } catch (excp) {
    console.error(`KC - init excp : ${excp} - ${type}`);
  }
  keycloak.onTokenExpired = () => {
    store.dispatch("auth/logout");
  };
  return keycloak;
}
