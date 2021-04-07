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
    await keycloak.init({
      onLoad: "check-sso",
      responseMode: "query",
      checkLoginIframe: false,
    });
    if (keycloak.authenticated) {
      console.log("In AUth Service Client Type Insti 1");
      switch (type) {
        case ClientIdType.STUDENT:
          store.dispatch("student/setStudentProfileData", keycloak);
          break;
        case ClientIdType.INSTITUTION: {
          console.log("In AUth Service Client Type Insti 2");
          console.dir(keycloak.token);
          const authHeader = HttpBaseClient.createAuthHeader(keycloak.token);
          const bceIdAccountDetails = await UserService.shared.getBCeIDAccountDetails(
            authHeader,
          );
          console.dir(bceIdAccountDetails);
          if (!bceIdAccountDetails.user) {
            // console.log("It is a Basic User");
            // const loginUrl = keycloak.createLoginUrl();
            // console.log(`Login url is ${loginUrl}`);
            // const logoutUrl = keycloak.createLogoutUrl();
            // console.log(`Log out url is ${logoutUrl}`);
            // await keycloak.logout({
            //   redirectUri:
            //     "http://localhost:8080/institution/login?basicBCeID=true",
            // });
          }
        }
      } //Switch case ends
    }
  } catch (excp) {
    console.error(`KC - init excp : ${excp} - ${type}`);
  }
  keycloak.onTokenExpired = () => {
    store.dispatch("auth/logout");
  };
  return keycloak;
}
