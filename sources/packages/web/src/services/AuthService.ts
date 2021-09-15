import Keycloak from "keycloak-js";
import store from "../store/index";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { AppConfigService } from "./AppConfigService";
import HttpBaseClient from "./http/common/HttpBaseClient";
import { UserService } from "./UserService";
import { InstitutionService } from "./InstitutionService";
import router from "../router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationToken, BCeIDDetailsDto } from "@/types";

/**
 * Manages the KeyCloak initialization and authentication methods.
 */
export class AuthService {
  /**
   * Keycloak instance available after the method initialize is called.
   */
  keycloak?: Keycloak.KeycloakInstance = undefined;
  authClientType?: ClientIdType = undefined;

  get userToken(): ApplicationToken | undefined {
    return this.keycloak?.tokenParsed as ApplicationToken;
  }

  get initialized(): boolean {
    return !!this.keycloak;
  }

  private static instance: AuthService;
  /**
   * Singleton access to the authentication service.
   */
  static get shared(): AuthService {
    return this.instance || (this.instance = new this());
  }

  async initialize(clientType: ClientIdType): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.authClientType = clientType;
    const config = await AppConfigService.shared.config();
    this.keycloak = Keycloak({
      url: config.authConfig.url,
      realm: config.authConfig.realm,
      clientId: config.authConfig.clientIds[clientType],
    });

    let isForbiddenUser = false;

    try {
      await this.keycloak.init({
        onLoad: "check-sso",
        responseMode: "query",
        checkLoginIframe: false,
      });

      if (this.keycloak.authenticated) {
        switch (clientType) {
          case ClientIdType.STUDENT:
            store.dispatch("student/setStudentProfileData", this.keycloak);
            break;
          case ClientIdType.INSTITUTION: {
            const authHeader = HttpBaseClient.createAuthHeader(
              this.keycloak.token,
            );
            const bceIdAccountDetails = await UserService.shared.getBCeIDAccountDetails(
              authHeader,
            );
            isForbiddenUser = await this.navigateForInstitution(
              authHeader,
              bceIdAccountDetails,
            );
            break;
          }

          case ClientIdType.AEST: {
            const authHeader = HttpBaseClient.createAuthHeader(
              this.keycloak.token,
            );
            const isAuthorized = await UserService.shared.syncAESTUser(
              authHeader,
            );
            if (!isAuthorized) {
              await this.logout(ClientIdType.AEST, { isNotAllowedUser: true });
            }
            break;
          }
        }
      }
    } catch (error) {
      console.error(
        `Key Cloak - initialization exception: ${error} - ${clientType}`,
      );
    }
    this.keycloak.onTokenExpired = () => {
      store.dispatch("auth/logout");
    };
    if (isForbiddenUser) {
      throw new Error("Forbidden user");
    }
  }

  private async navigateForInstitution(
    authHeader: any,
    bceIdAccountDetails: BCeIDDetailsDto,
  ): Promise<boolean> {
    if (!bceIdAccountDetails) {
      await this.logout(ClientIdType.INSTITUTION, { isBasicBCeID: true });
      return false;
    } else if (await UserService.shared.checkUser(authHeader)) {
      if (!(await UserService.shared.checkActiveUser(authHeader))) {
        await this.logout(ClientIdType.INSTITUTION, { isUserDisabled: true });
        return true;
      }
      await store.dispatch("institution/initialize", authHeader);
      return false;
    } else {
      if (
        await InstitutionService.shared.checkIfExist(
          bceIdAccountDetails.institution.guid,
          authHeader,
        )
      ) {
        await this.logout(ClientIdType.INSTITUTION, { isUnknownUser: true });
        return true;
      }
      router.push({
        name: InstitutionRoutesConst.INSTITUTION_PROFILE,
      });
      return false;
    }
  }

  async logout(
    type: ClientIdType,
    options?: {
      isBasicBCeID?: boolean;
      isUserDisabled?: boolean;
      isUnknownUser?: boolean;
      isNotAllowedUser?: boolean;
    },
  ) {
    let redirectUri = `${window.location.protocol}//${window.location.host}/${type}`;
    switch (type) {
      case ClientIdType.STUDENT: {
        await this.keycloak!.logout({
          redirectUri,
        });
        break;
      }
      case ClientIdType.INSTITUTION: {
        if (options?.isBasicBCeID) {
          redirectUri += "/login/business-bceid";
        } else if (options?.isUserDisabled) {
          redirectUri += "/login/disabled-user";
        } else if (options?.isUnknownUser) {
          redirectUri += "/login/unknown-user";
        }
        const logoutURL = this.keycloak!.createLogoutUrl({
          redirectUri,
        });
        const config = await AppConfigService.shared.config();
        const externalLogoutUrl = config.authConfig.externalSiteMinderLogoutUrl;
        const siteMinderLogoutURL = `${externalLogoutUrl}?returl=${logoutURL}&retnow=1`;
        window.location.href = siteMinderLogoutURL;
        break;
      }
      case ClientIdType.AEST: {
        if (options?.isNotAllowedUser) {
          redirectUri += "/login/not-allowed-user";
          await this.keycloak!.logout({
            redirectUri,
          });
        } else {
          await this.keycloak!.logout();
        }
        break;
      }
      default:
        await this.keycloak!.logout();
        break;
    }
  }
}
