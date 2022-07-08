import Keycloak from "keycloak-js";
import store from "../store/index";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { AppConfigService } from "./AppConfigService";
import HttpBaseClient from "./http/common/HttpBaseClient";
import { UserService } from "./UserService";
import { InstitutionService } from "./InstitutionService";
import { ApplicationToken } from "@/types";
import { RouteHelper } from "@/helpers";
import { LocationAsRelativeRaw } from "vue-router";
import {
  InstitutionRoutesConst,
  StudentRoutesConst,
} from "@/constants/routes/RouteConstants";
import { RENEW_AUTH_TOKEN_TIMER } from "@/constants/system-constants";
import { StudentService } from "@/services/StudentService";
import { useStudentStore } from "@/composables";

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

  interval = NaN;

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
   * When populated, indicates that there is a route that
   * must take priority over all the other ones.
   * After the redirect happens this variable must
   * be set to undefined.
   */
  priorityRedirect?: LocationAsRelativeRaw = undefined;

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

    try {
      await this.keycloak.init({
        onLoad: "check-sso",
        responseMode: "query",
        checkLoginIframe: false,
      });

      if (this.keycloak.authenticated) {
        this.interval = setInterval(
          this.renewTokenIfExpired,
          RENEW_AUTH_TOKEN_TIMER,
        );
        switch (clientType) {
          case ClientIdType.Student: {
            await this.processStudentLogin();
            break;
          }
          case ClientIdType.Institution: {
            await this.processInstitutionLogin();
            break;
          }
          case ClientIdType.AEST: {
            await this.processAESTLogin();
            break;
          }
        }
      } else {
        clearInterval(this.interval);
      }
    } catch (error) {
      console.error(`Keycloak initialization error - ${clientType}`);
      console.error(error);
    }
  }

  /**
   * Process the login for the student redirecting to the student profile
   * creation case it is the first access.
   */
  private async processStudentLogin() {
    const studentStore = useStudentStore(store);
    const hasStudentAccount =
      await StudentService.shared.synchronizeFromUserToken();
    await studentStore.setHasStudentAccount(hasStudentAccount);
    if (hasStudentAccount) {
      await studentStore.updateProfileData();
    } else {
      // If the student is not present, redirect to student profile
      // for account creation.
      this.priorityRedirect = {
        name: StudentRoutesConst.STUDENT_PROFILE,
      };
    }
  }

  /**
   * Process the login for the institution executing the verifications
   * to determine if the user can proceed or must be redirect somewhere.
   */
  private async processInstitutionLogin() {
    const userStatus =
      await InstitutionService.shared.getInstitutionUserStatus();
    console.log(userStatus);
    if (userStatus.isActiveUser === true) {
      // User is active so just proceed.
      await store.dispatch("institution/initialize");
      return;
    }

    if (userStatus.isActiveUser === false) {
      // User exists and it is not active.
      // Redirect to login page with a proper message.
      await this.logout(ClientIdType.Institution, {
        isUserDisabled: true,
      });
      return;
    }

    if (
      !userStatus.isExistingUser &&
      !userStatus.associatedInstitutionExists &&
      userStatus.hasBusinessBCeIDAccount
    ) {
      // Business BCeID user logging for the first time when the institution is not created yet.
      // Redirect to the institution profile to allow the user to create the institution.
      this.priorityRedirect = {
        name: InstitutionRoutesConst.INSTITUTION_CREATE,
      };
      return;
    }

    if (!userStatus.isExistingUser) {
      // User is a business BCeID, the institution exists but the user was never added, hence he is not allowed to access
      // the application and must request to his administrator to include him using the manage users UI.
      // Or user is a basic BCeID that must be added by the Ministry before have access to the system.
      await this.logout(ClientIdType.Institution, {
        isUnknownUser: true,
      });
    }
  }

  /**
   * Process the login for AEST verifying if the user belongs to the group that
   * allow an IDIR to have access to the application.
   */
  private async processAESTLogin() {
    const isAuthorized = await UserService.shared.syncAESTUser();
    if (!isAuthorized) {
      await this.logout(ClientIdType.AEST, { notAllowedUser: true });
    }
  }

  async logout(
    type: ClientIdType,
    options?: {
      isUserDisabled?: boolean;
      isUnknownUser?: boolean;
      notAllowedUser?: boolean;
    },
  ): Promise<void> {
    if (!this.keycloak) {
      throw new Error("Keycloak not initialized.");
    }
    let redirectUri = RouteHelper.getAbsoluteRootRoute(type);
    switch (type) {
      case ClientIdType.Institution: {
        if (options?.isUserDisabled) {
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
        await this.keycloak.logout({
          redirectUri,
        });
        break;
    }
  }

  private async executeSiteminderLogoff(redirectUri: string) {
    if (!this.keycloak) {
      throw new Error("Keycloak not initialized.");
    }
    const logoutURL = this.keycloak.createLogoutUrl({
      redirectUri,
    });
    const config = await AppConfigService.shared.config();
    const externalLogoutUrl = config.authConfig.externalSiteMinderLogoutUrl;
    const siteMinderLogoutURL = `${externalLogoutUrl}?returl=${logoutURL}&retnow=1`;
    window.location.href = siteMinderLogoutURL;
  }

  async renewTokenIfExpired() {
    await HttpBaseClient.renewTokenIfExpired();
  }
}
