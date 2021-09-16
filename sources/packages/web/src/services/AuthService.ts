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
import { RouteHelper } from "@/helpers";

/**
 * Manages the KeyCloak initialization and authentication methods.
 */
export class AuthService {
  /**
   * Keycloak instance available after the method initialize is called.
   */
  keycloak?: Keycloak.KeycloakInstance = undefined;

  private clientType?: ClientIdType = undefined;
  /**
   * Type of Keycloak client used for initialization.
   */
  get authClientType(): ClientIdType | undefined {
    return this.clientType;
  }

  /**
   * Parsed user token.
   */
  get userToken(): ApplicationToken | undefined {
    return this.keycloak?.tokenParsed as ApplicationToken;
  }

  /**
   * Indicates that Keycloak is already initialized.
   */
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

  /**
   * Initializes the authentication service with the proper client type.
   * @param clientType Keycloak client type to be used.
   */
  async initialize(clientType: ClientIdType): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.clientType = clientType;
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
              isForbiddenUser = true;
              await this.logout(ClientIdType.AEST, { notAllowedUser: true });
            }
            break;
          }
        }
      }
    } catch (error) {
      console.error(`Keycloak initialization error - ${clientType}`);
      console.log(error);
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
      notAllowedUser?: boolean;
    },
  ): Promise<void> {
    let redirectUri = RouteHelper.getAbsoluteRootRoute(type);
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
        await this.executeSiteminderLogoff(redirectUri);
        break;
      }
      case ClientIdType.AEST: {
        if (options?.notAllowedUser) {
          redirectUri += "/login/not-allowed-user";
        }
        await this.executeSiteminderLogoff(redirectUri);
        break;
      }
      default:
        await this.keycloak!.logout();
        break;
    }
  }

  private async executeSiteminderLogoff(redirectUri: string) {
    const logoutURL = this.keycloak!.createLogoutUrl({
      redirectUri,
    });
    const config = await AppConfigService.shared.config();
    const externalLogoutUrl = config.authConfig.externalSiteMinderLogoutUrl;
    const siteMinderLogoutURL = `${externalLogoutUrl}?returl=${logoutURL}&retnow=1`;
    window.location.href = siteMinderLogoutURL;
  }
}
