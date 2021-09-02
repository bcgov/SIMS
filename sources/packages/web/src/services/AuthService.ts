import Keycloak from "keycloak-js";
import store from "../store/index";
import { AppConfig, ClientIdType } from "../types/contracts/ConfigContract";
import { AppConfigService } from "./AppConfigService";
import HttpBaseClient from "./http/common/HttpBaseClient";
import { UserService } from "./UserService";
import { InstitutionService } from "./InstitutionService";
import router from "../router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
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
  let isForbiddenUser = false;

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

          if (!bceIdAccountDetails) {
            await AppConfigService.shared.logout(
              ClientIdType.INSTITUTION,
              keycloak,
              true,
            );
            isForbiddenUser = true;
          } else if (await UserService.shared.checkUser(authHeader)) {
            if (!(await UserService.shared.checkActiveUser(authHeader))) {
              await AppConfigService.shared.logout(
                ClientIdType.INSTITUTION,
                keycloak,
                false,
                true,
              );
              isForbiddenUser = true;
            } else {
              await store.dispatch("institution/initialize", authHeader);
            }
          } else if (!InstitutionService.shared.getDetail()) {
            router.push({
              name: InstitutionRoutesConst.INSTITUTION_PROFILE,
            });
          } else {
            await AppConfigService.shared.logout(
              ClientIdType.INSTITUTION,
              keycloak,
              false,
              false,
              true,
            );
            isForbiddenUser = true;
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
  if (isForbiddenUser) {
    throw new Error("Forbidden user");
  }
  return keycloak;
}
